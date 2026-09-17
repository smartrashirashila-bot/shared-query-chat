import { DurableObject } from "cloudflare:workers";

const HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shared Query Chat</title><style>
*{box-sizing:border-box}body{margin:0;font:14px Arial;background:#f4f5f7;color:#111}header{height:56px;background:#fff;border-bottom:1px solid #ddd;padding:0 16px;display:flex;align-items:center;gap:14px}.room{color:#777;font-size:12px}.status{margin-left:auto;color:#777}main{display:grid;grid-template-columns:1fr 360px;height:calc(100vh - 56px)}.sheet{background:#fff;overflow:auto}.bar{padding:10px;border-bottom:1px solid #ddd;display:flex;gap:8px}input,button{padding:9px;border:1px solid #ccc;border-radius:6px;font:inherit}#q{flex:1}button{background:#222;color:#fff;cursor:pointer}table{border-collapse:collapse;width:100%;min-width:650px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#eef0f2;position:sticky;top:0}.chat{display:flex;flex-direction:column;border-left:1px solid #ddd;background:#fafafa}.chat h3{margin:0;padding:14px;border-bottom:1px solid #ddd}#msgs{flex:1;overflow:auto;padding:10px}.msg{background:#fff;border:1px solid #ddd;border-radius:8px;padding:8px;margin:7px 0}.meta{font-size:11px;color:#777;margin-bottom:3px}.send{display:flex;gap:7px;padding:10px;border-top:1px solid #ddd}.send input{flex:1}@media(max-width:760px){main{display:flex;flex-direction:column;height:auto}.sheet{height:55vh}.chat{height:45vh;border-left:0;border-top:1px solid #ddd}.status{display:none}}</style></head><body>
<header><b>📊 Shared Query Chat</b><span class="room" id="room"></span><span class="status" id="status">Connecting…</span></header>
<main><section class="sheet"><div class="bar"><input id="q" placeholder="Type a query…"><button id="qb">Query</button></div><table><thead><tr><th>#</th><th>Query</th><th>Answer / Notes</th><th>User</th></tr></thead><tbody id="rows"></tbody></table></section>
<section class="chat"><h3>💬 Shared Chat</h3><div id="msgs"></div><form class="send" id="form"><input id="m" placeholder="Type a message…" autocomplete="off"><button>Send</button></form></section></main>
<script>
const p=new URLSearchParams(location.search),room=p.get("room")||"demo";document.querySelector("#room").textContent="Room: "+room;
const name=(prompt("Your name?")||"Guest").slice(0,40), ws=new WebSocket((location.protocol==="https:"?"wss://":"ws://")+location.host+"/ws?room="+encodeURIComponent(room)+"&name="+encodeURIComponent(name));
const msgs=document.querySelector("#msgs"),rows=document.querySelector("#rows"),status=document.querySelector("#status");
function addMsg(u,t,time){let d=document.createElement("div");d.className="msg";let x=document.createElement("div");x.className="meta";x.textContent=u+(time?" · "+new Date(time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"");let b=document.createElement("div");b.textContent=t;d.append(x,b);msgs.append(d);msgs.scrollTop=msgs.scrollHeight}
function addRow(q,a,u){let tr=document.createElement("tr");[rows.children.length+1,q,a,u].forEach(v=>{let td=document.createElement("td");td.textContent=v;tr.append(td)});rows.append(tr)}
ws.onopen=()=>status.textContent="● Connected";ws.onclose=()=>status.textContent="Disconnected";ws.onerror=()=>status.textContent="Connection error";
ws.onmessage=e=>{let d=JSON.parse(e.data);if(d.type==="history")d.messages.forEach(x=>x.type==="chat"?addMsg(x.user,x.message,x.created_at):addRow(x.query,x.answer,x.user));if(d.type==="chat")addMsg(d.user,d.text,d.time);if(d.type==="query")addRow(d.query,d.answer,d.user)};
document.querySelector("#form").onsubmit=e=>{e.preventDefault();let i=document.querySelector("#m"),t=i.value.trim();if(t)ws.send(JSON.stringify({type:"chat",user:name,text:t}));i.value=""};
document.querySelector("#qb").onclick=()=>{let i=document.querySelector("#q"),q=i.value.trim();if(q)ws.send(JSON.stringify({type:"query",user:name,query:q,answer:"Query received. AI/search integration can be connected here."}));i.value=""};
</script></body></html>`;

export class ChatRoom extends DurableObject {
  constructor(ctx, env){super(ctx,env);this.ctx=ctx;this.ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT,type TEXT,user TEXT,message TEXT,query TEXT,answer TEXT,created_at TEXT)");}
  async fetch(request){
    if(request.headers.get("Upgrade")!=="websocket") return new Response("Chat room is running.");
    const pair=new WebSocketPair(),server=pair[1];this.ctx.acceptWebSocket(server);
    const h=this.ctx.storage.sql.exec("SELECT type,user,message,query,answer,created_at FROM messages ORDER BY id DESC LIMIT 100").toArray().reverse();
    server.send(JSON.stringify({type:"history",messages:h}));return new Response(null,{status:101,webSocket:pair[0]});
  }
  webSocketMessage(ws,raw){try{const d=JSON.parse(raw),u=String(d.user||"Guest").slice(0,40),t=new Date().toISOString();let out;if(d.type==="chat"){const text=String(d.text||"").trim().slice(0,2000);if(!text)return;this.ctx.storage.sql.exec("INSERT INTO messages(type,user,message,created_at) VALUES(?,?,?,?)","chat",u,text,t);out={type:"chat",user:u,text,time:t}}else if(d.type==="query"){const q=String(d.query||"").trim().slice(0,500);const a=String(d.answer||"").slice(0,5000);if(!q)return;this.ctx.storage.sql.exec("INSERT INTO messages(type,user,query,answer,created_at) VALUES(?,?,?,?,?)","query",u,q,a,t);out={type:"query",user:u,query:q,answer:a,time:t}}else return;for(const s of this.ctx.getWebSockets())try{s.send(JSON.stringify(out))}catch{}}catch{}}
}
export default {async fetch(request,env){const u=new URL(request.url);if(u.pathname==="/ws"){const room=u.searchParams.get("room")||"demo";return env.CHAT_ROOM.get(env.CHAT_ROOM.idFromName(room)).fetch(request)}return new Response(HTML,{headers:{"content-type":"text/html;charset=UTF-8"}})}};
