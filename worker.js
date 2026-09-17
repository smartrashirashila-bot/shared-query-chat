import { DurableObject } from "cloudflare:workers";

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shared Spreadsheet Chat</title>

<style>
*{box-sizing:border-box}

body{
 margin:0;
 font:14px Arial,sans-serif;
 background:#f3f4f6;
 color:#111;
 overflow:hidden
}

header{
 height:54px;
 background:#fff;
 border-bottom:1px solid #d8dce1;
 padding:0 14px;
 display:flex;
 align-items:center;
 gap:12px
}

header b{font-size:16px}
.room{color:#777;font-size:12px}
.status{margin-left:auto;color:#777;font-size:12px}

main{
 display:grid;
 grid-template-columns:minmax(0,1fr) 360px;
 height:calc(100vh - 54px);
 transition:grid-template-columns .2s ease
}

/* SPREADSHEET */

.sheet{
 background:#fff;
 min-width:0;
 display:flex;
 flex-direction:column
}

.toolbar{
 height:48px;
 padding:7px 9px;
 border-bottom:1px solid #d8dce1;
 display:flex;
 gap:6px;
 align-items:center;
 background:#f8f9fa
}

.toolbar button,
.toolbar input{
 height:32px;
 padding:5px 10px;
 border:1px solid #c9ced6;
 border-radius:4px;
 background:#fff;
 font:inherit
}

.toolbar button{
 cursor:pointer
}

.toolbar button:hover{
 background:#eef2f6
}

#q{
 flex:1;
 min-width:120px
}

.hint{
 color:#777;
 font-size:12px;
 margin-left:3px
}

.gridwrap{
 flex:1;
 overflow:auto;
 background:#fff
}

table{
 border-collapse:separate;
 border-spacing:0;
 min-width:850px;
 width:100%;
 table-layout:fixed
}

th,td{
 border-right:1px solid #d8dce1;
 border-bottom:1px solid #d8dce1;
 height:30px;
 padding:5px 7px;
 text-align:left;
 white-space:nowrap;
 overflow:hidden;
 text-overflow:ellipsis
}

thead th{
 position:sticky;
 top:0;
 z-index:3;
 background:#eef1f4;
 font-weight:bold;
 text-align:center
}

thead th:first-child{
 left:0;
 z-index:5
}

.rownum{
 position:sticky;
 left:0;
 z-index:2;
 background:#f7f8f9;
 text-align:center;
 color:#666;
 width:44px
}

td[contenteditable="true"]{
 background:#fff;
 outline:none
}

.cell-edit:focus{
 box-shadow:inset 0 0 0 2px #4d90fe;
 white-space:normal;
 overflow:visible
}

.c-query{width:36%}
.c-answer{width:44%}
.c-user{width:130px}

/* MESSENGER */

.chat{
 display:flex;
 flex-direction:column;
 border-left:1px solid #cfd4da;
 background:#fafafa;
 min-width:0;
 transition:all .2s ease
}

.chathead{
 height:48px;
 padding:0 10px;
 border-bottom:1px solid #d8dce1;
 display:flex;
 align-items:center;
 gap:8px;
 background:#fff
}

.chathead b{
 flex:1
}

.chathead button{
 border:1px solid #c9ced6;
 background:#fff;
 border-radius:4px;
 height:30px;
 cursor:pointer
}

#msgs{
 flex:1;
 overflow:auto;
 padding:10px
}

.msg{
 background:#fff;
 border:1px solid #ddd;
 border-radius:8px;
 padding:8px;
 margin:7px 0;
 overflow-wrap:anywhere
}

.meta{
 font-size:11px;
 color:#777;
 margin-bottom:3px
}

.send{
 display:flex;
 gap:7px;
 padding:9px;
 border-top:1px solid #ddd;
 background:#fff
}

.send input{
 flex:1;
 min-width:0;
 padding:9px;
 border:1px solid #ccc;
 border-radius:6px
}

.send button{
 padding:9px 13px;
 border:0;
 border-radius:6px;
 background:#222;
 color:#fff;
 cursor:pointer
}

/* MINIMIZED CHAT */

#restore{
 display:none;
 position:fixed;
 right:14px;
 bottom:14px;
 z-index:20;
 border:1px solid #c9ced6;
 border-radius:20px;
 background:#fff;
 padding:10px 15px;
 box-shadow:0 3px 12px #0002;
 cursor:pointer;
 font-weight:bold
}

body.chat-min main{
 grid-template-columns:1fr 0
}

.chat-minimized{
 display:none!important
}

body.chat-min #restore{
 display:block
}

/* MOBILE */

@media(max-width:760px){

 body{
  overflow:auto
 }

 main{
  display:flex;
  flex-direction:column;
  height:auto
 }

 .sheet{
  height:calc(100vh - 54px)
 }

 .chat{
  position:fixed;
  inset:auto 0 0 0;
  height:48vh;
  border-left:0;
  border-top:1px solid #ddd
 }

 .chat-minimized{
  display:none!important
 }

 body.chat-min .sheet{
  height:calc(100vh - 54px)
 }

}
</style>
</head>

<body>

<header>
<b>📊 Shared Spreadsheet</b>
<span class="room" id="room"></span>
<span class="status" id="status">Connecting…</span>
</header>

<main>

<section class="sheet">

<div class="toolbar">

<button id="add">＋ Row</button>

<button id="clear">Clear</button>

<input
 id="q"
 placeholder="Enter query for the shared spreadsheet…"
>

<button id="qb">Run Query</button>

<span class="hint">
Double-click cells to edit
</span>

</div>

<div class="gridwrap">

<table>

<thead>

<tr>
<th class="corner"></th>
<th class="c-query">Query</th>
<th class="c-answer">Answer / Notes</th>
<th class="c-user">User</th>
</tr>

</thead>

<tbody id="rows"></tbody>

</table>

</div>

</section>

<section class="chat" id="chat">

<div class="chathead">

<b>💬 Shared Messenger</b>

<button id="min">− Minimize</button>

</div>

<div id="msgs"></div>

<form class="send" id="form">

<input
 id="m"
 placeholder="Type a message…"
 autocomplete="off"
>

<button>Send</button>

</form>

</section>

</main>

<button id="restore">
💬 Messenger
</button>

<script>

const p=new URLSearchParams(location.search);

const room=p.get("room")||"demo";

document.querySelector("#room").textContent="Room: "+room;

const name=(prompt("Your name?")||"Guest").slice(0,40);

const ws=new WebSocket(
 (location.protocol==="https:"?"wss://":"ws://")
 +location.host
 +"/ws?room="
 +encodeURIComponent(room)
 +"&name="
 +encodeURIComponent(name)
);

const msgs=document.querySelector("#msgs");

const rows=document.querySelector("#rows");

const status=document.querySelector("#status");

let rowCount=0;


/* CHAT MESSAGE */

function addMsg(u,t,time){

 let d=document.createElement("div");

 d.className="msg";

 let x=document.createElement("div");

 x.className="meta";

 x.textContent=
 u+
 (time?
 " · "+
 new Date(time).toLocaleTimeString(
 [],
 {hour:"2-digit",minute:"2-digit"}
 )
 :"");

 let b=document.createElement("div");

 b.textContent=t;

 d.append(x,b);

 msgs.append(d);

 msgs.scrollTop=msgs.scrollHeight;

}


/* SPREADSHEET ROW */

function addRow(q,a,u){

 rowCount++;

 let tr=document.createElement("tr");

 let rn=document.createElement("td");

 rn.className="rownum";

 rn.textContent=rowCount;

 tr.append(rn);

 [
  [q,"query"],
  [a,"answer"],
  [u,"user"]
 ].forEach(([v,type])=>{

  let td=document.createElement("td");

  td.textContent=v||"";

  if(type!=="user"){

   td.className="cell-edit";

   td.contentEditable="true";

   td.title="Double-click to edit";

   td.addEventListener(
    "dblclick",
    ()=>td.focus()
   );

  }

  tr.append(td);

 });

 rows.append(tr);

}


/* CLEAR ROWS */

function clearRows(){

 rows.innerHTML="";

 rowCount=0;

}


/* WEBSOCKET */

ws.onopen=()=>{

 status.textContent="● Connected";

};

ws.onclose=()=>{

 status.textContent="Disconnected";

};

ws.onerror=()=>{

 status.textContent="Connection error";

};


/* RECEIVE */

ws.onmessage=e=>{

 let d=JSON.parse(e.data);

 if(d.type==="history"){

  clearRows();

  d.messages.forEach(x=>

   x.type==="chat"
   ?addMsg(x.user,x.message,x.created_at)
   :addRow(x.query,x.answer,x.user)

  );

 }

 if(d.type==="chat"){

  addMsg(d.user,d.text,d.time);

 }

 if(d.type==="query"){

  addRow(
   d.query,
   d.answer,
   d.user
  );

 }

};


/* SEND CHAT */

document.querySelector("#form").onsubmit=e=>{

 e.preventDefault();

 let i=document.querySelector("#m");

 let t=i.value.trim();

 if(t && ws.readyState===1){

  ws.send(JSON.stringify({
   type:"chat",
   user:name,
   text:t
  }));

 }

 i.value="";

 i.focus();

};


/* QUERY */

document.querySelector("#qb").onclick=()=>{

 let i=document.querySelector("#q");

 let q=i.value.trim();

 if(q && ws.readyState===1){

  ws.send(JSON.stringify({
   type:"query",
   user:name,
   query:q,
   answer:"Query received. AI/search integration can be connected here."
  }));

 }

 i.value="";

 i.focus();

};


/* ENTER TO QUERY */

document.querySelector("#q").onkeydown=e=>{

 if(e.key==="Enter"){

  document.querySelector("#qb").click();

 }

};


/* ADD ROW */

document.querySelector("#add").onclick=()=>{

 addRow("","","");

};


/* CLEAR */

document.querySelector("#clear").onclick=()=>{

 if(confirm("Clear the visible spreadsheet rows?")){

  clearRows();

 }

};


/* MINIMIZE */

document.querySelector("#min").onclick=()=>{

 document.body.classList.add("chat-min");

 document.querySelector("#chat")
 .classList.add("chat-minimized");

};


/* RESTORE */

document.querySelector("#restore").onclick=()=>{

 document.body.classList.remove("chat-min");

 document.querySelector("#chat")
 .classList.remove("chat-minimized");

};

</script>

</body>
</html>`;

export class ChatRoom extends DurableObject {

 constructor(ctx,env){

  super(ctx,env);

  this.ctx=ctx;

  this.ctx.storage.sql.exec(
   "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT,type TEXT,user TEXT,message TEXT,query TEXT,answer TEXT,created_at TEXT)"
  );

 }

 async fetch(request){

  if(request.headers.get("Upgrade")!=="websocket")

   return new Response("Chat room is running.");

  const pair=new WebSocketPair();

  const server=pair[1];

  this.ctx.acceptWebSocket(server);

  const h=this.ctx.storage.sql.exec(
   "SELECT type,user,message,query,answer,created_at FROM messages ORDER BY id DESC LIMIT 100"
  ).toArray().reverse();

  server.send(
   JSON.stringify({
    type:"history",
    messages:h
   })
  );

  return new Response(null,{
   status:101,
   webSocket:pair[0]
  });

 }

 webSocketMessage(ws,raw){

  try{

   const d=JSON.parse(raw);

   const u=String(d.user||"Guest").slice(0,40);

   const t=new Date().toISOString();

   let out;

   if(d.type==="chat"){

    const text=String(d.text||"")
     .trim()
     .slice(0,2000);

    if(!text)return;

    this.ctx.storage.sql.exec(
     "INSERT INTO messages(type,user,message,created_at) VALUES(?,?,?,?)",
     "chat",
     u,
     text,
     t
    );

    out={
     type:"chat",
     user:u,
     text:text,
     time:t
    };

   }

   else if(d.type==="query"){

    const q=String(d.query||"")
     .trim()
     .slice(0,500);

    const a=String(d.answer||"")
     .slice(0,5000);

    if(!q)return;

    this.ctx.storage.sql.exec(
     "INSERT INTO messages(type,user,query,answer,created_at) VALUES(?,?,?,?,?)",
     "query",
     u,
     q,
     a,
     t
    );

    out={
     type:"query",
     user:u,
     query:q,
     answer:a,
     time:t
    };

   }

   else return;

   for(const s of this.ctx.getWebSockets())

    try{

     s.send(JSON.stringify(out));

    }catch{}

  }catch{}

 }

}

export default {

 async fetch(request,env){

  const u=new URL(request.url);

  if(u.pathname==="/ws"){

   const room=
    u.searchParams.get("room")||"demo";

   return env.CHAT_ROOM.get(
    env.CHAT_ROOM.idFromName(room)
   ).fetch(request);

  }

  return new Response(
   HTML,
   {
    headers:{
     "content-type":
     "text/html;charset=UTF-8"
    }
   }
  );

 }

};
