import { DurableObject } from "cloudflare:workers";

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shared AI Spreadsheet</title>

<style>
*{box-sizing:border-box}
:root{--green:#217346;--green2:#e2f0e8;--line:#d9e1dc;--ink:#202a24;--muted:#68756d;--bg:#f3f6f4}
body{margin:0;font:14px "Aptos","Segoe UI",Arial,sans-serif;background:var(--bg);color:var(--ink);overflow:hidden}
header{height:58px;background:#fff;border-bottom:1px solid var(--line);padding:0 18px;display:flex;align-items:center;gap:12px}
header b{font-size:17px;color:var(--green)}.room{color:var(--muted);font-size:12px}.status{margin-left:auto;color:var(--muted);font-size:12px}
main{display:grid;grid-template-columns:minmax(0,1fr) 390px;height:calc(100vh - 58px)}
.sheet{background:#fff;min-width:0;display:flex;flex-direction:column;margin:14px 0 14px 14px;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.toolbar{min-height:54px;padding:9px 12px;border-bottom:1px solid var(--line);display:flex;gap:7px;align-items:center;background:#fbfdfb}
.toolbar button,.toolbar input{height:34px;padding:6px 11px;border:1px solid #cbd7ce;border-radius:6px;background:#fff;font:inherit;color:var(--ink)}
.toolbar button{cursor:pointer}.toolbar button:hover{background:var(--green2)}#q{flex:1;min-width:100px}
.gridwrap{flex:1;overflow:auto}table{border-collapse:separate;border-spacing:0;min-width:760px;width:100%;table-layout:fixed}
th,td{border-right:1px solid #e1e8e3;border-bottom:1px solid #e1e8e3;height:38px;padding:7px 10px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
thead th{position:sticky;top:0;z-index:3;background:#eaf2ec;color:#315d40;font-weight:650}
.rownum{position:sticky;left:0;z-index:2;background:#f5f8f5;text-align:center;color:#849087;width:48px}
.c-query{width:28%}.c-answer{width:52%}.c-user{width:120px}
.cell-edit:focus{outline:2px solid #4b9b69;outline-offset:-2px;white-space:normal;overflow:visible;background:#fbfffc}
.ai{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:10px;background:#fff;min-width:0;margin:14px;overflow:hidden}
.aihead{padding:15px 16px;border-bottom:1px solid var(--line);background:#fbfdfb}.aihead b{display:block;font-size:16px;color:#285d3c}.aihead span{font-size:11px;color:var(--muted)}
.min{float:right;border:1px solid var(--line);background:#fff;border-radius:6px;padding:6px 9px;cursor:pointer}
.answer{flex:1;overflow:auto;padding:13px;background:#f9fbf9}.card{background:#fff;border:1px solid var(--line);border-radius:9px;padding:12px;margin-bottom:10px;overflow-wrap:anywhere}
.meta{font-size:11px;color:var(--muted);margin-bottom:7px}.sources{margin-top:12px;border-top:1px solid #edf1ed;padding-top:8px}.sources a{display:block;margin-top:7px;color:#1769aa;text-decoration:none}
.chatlog{height:180px;overflow:auto;padding:10px;border-top:1px solid var(--line);background:#f6f9f6}.chatmsg{background:#fff;border:1px solid var(--line);border-radius:8px;padding:9px 10px;margin:6px 0;overflow-wrap:anywhere}.chatmsg.selected{outline:2px solid #4b9b69}
.chatrow{display:flex;gap:7px;padding:9px;background:#fff;border-top:1px solid var(--line)}.chatrow input{flex:1;min-width:0;padding:9px;border:1px solid #cbd7ce;border-radius:6px;font:inherit}
.chatrow button,.eye{border:1px solid #cbd7ce;background:#f8fbf8;color:#315d40;border-radius:6px;padding:6px 9px;cursor:pointer}.eye{margin-left:7px;padding:4px 8px}
.masked{filter:none!important;user-select:none;letter-spacing:2px;color:#59675d}
.ask{padding:11px;border-top:1px solid var(--line);background:#fff}.ask textarea{width:100%;height:78px;resize:none;padding:10px;border:1px solid #cbd7ce;border-radius:7px;font:inherit}
.askrow{display:flex;gap:7px;margin-top:7px}.ask button{flex:1;padding:10px 14px;border:0;border-radius:7px;background:var(--green);color:#fff;cursor:pointer;font-weight:600}
#restore{display:none;position:fixed;right:14px;bottom:14px;z-index:20;border:1px solid var(--line);border-radius:22px;background:#fff;padding:10px 15px;box-shadow:0 3px 12px #0002;cursor:pointer;font-weight:600;color:var(--green)}
body.min main{grid-template-columns:1fr 0}body.min .ai{display:none}body.min #restore{display:block}
@media(max-width:760px){body{overflow:auto}main{display:flex;flex-direction:column;height:auto}.sheet{height:calc(100vh - 58px);margin:8px;border-radius:8px}.ai{position:fixed;inset:auto 0 0 0;height:52vh;margin:0;border-radius:12px 12px 0 0;border-left:0}.chatlog{height:100px}}
</style>
</head>

<body>

<header>
<b>▦ Shared Query Chat</b>
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
 placeholder="Enter query…"
>

<button id="qb">Run Query</button>

</div>

<div class="gridwrap">

<table>

<thead>

<tr>
<th></th>
<th class="c-query">Query</th>
<th class="c-answer">AI Answer</th>
<th class="c-user">User</th>
</tr>

</thead>

<tbody id="rows"></tbody>

</table>

</div>

</section>


<section class="ai" id="ai">

<div class="aihead">

<button class="min" id="min">
− Minimize
</button>

<b>🤖 AI Query</b>

<span>
Ask anything • AI + Live Web Search
</span>

</div>


<div class="answer" id="answer">

<div class="card">

<div class="meta">
Ready
</div>

Ask anything using the box below.

The system will search the web and use AI to prepare the answer.

</div>

</div>

<div class="chatlog" id="chatlog" aria-label="Shared encrypted chat"></div>
<div class="chatrow">
 <input id="chatinput" placeholder="Private shared message…" autocomplete="off">
 <button id="encryptSend" type="button" title="Encrypt and send">Send</button>
 <button id="decryptSelected" type="button" title="Decrypt selected message">D</button>
</div>

<form class="ask" id="form">

<textarea
 id="m"
 placeholder="Ask anything..."
></textarea>

<div class="askrow">

<button id="ask" type="submit">
🔎 Ask AI & Search
</button>

</div>

</form>

</section>

</main>


<button id="restore">
🤖 AI Query
</button>


<script>

const p=new URLSearchParams(location.search);
const roomFromLink=p.get("room");
const room=roomFromLink || sessionStorage.getItem("shared-chat-room") || "demo";
if(roomFromLink) sessionStorage.setItem("shared-chat-room",roomFromLink);
if(p.has("room")) history.replaceState({},document.title,location.pathname);
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


const rows=document.querySelector("#rows");

const answer=document.querySelector("#answer");

const status=document.querySelector("#status");

const askButton=document.querySelector("#ask");
const chatlog=document.querySelector("#chatlog");
let selectedChat=null;
const chatPlaintext=new WeakMap();
let rowNumber=0;

function bytesToB64(bytes){
 let binary="";
 new Uint8Array(bytes).forEach(b=>binary+=String.fromCharCode(b));
 return btoa(binary);
}
function b64ToBytes(value){
 const binary=atob(value);
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
async function deriveChatKey(password,salt){
 const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function encryptChatText(plain,password){
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await deriveChatKey(password,salt);
 const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(plain));
 return "ENC1:"+JSON.stringify({s:bytesToB64(salt),i:bytesToB64(iv),c:bytesToB64(encrypted)});
}
async function decryptChatText(payload,password){
 const data=JSON.parse(payload.slice(5));
 const key=await deriveChatKey(password,b64ToBytes(data.s));
 const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64ToBytes(data.i)},key,b64ToBytes(data.c));
 return new TextDecoder().decode(plain);
}
function addChatMessage(d){
 const card=document.createElement("div");
 card.className="chatmsg";
 card.dataset.encrypted=String(String(d.message||"").startsWith("ENC1:"));
 const meta=document.createElement("div");
 meta.className="meta";
 meta.textContent=(d.user||"Guest")+" · "+new Date(d.time||Date.now()).toLocaleTimeString();
 const body=document.createElement("span");
 body.textContent=card.dataset.encrypted?"••••••••••••••":String(d.message||"");
 body.className="masked";
 const eye=document.createElement("button");
 eye.className="eye";eye.type="button";eye.textContent="👁";
 eye.title="Show or hide message";
 eye.onclick=async()=>{
   const plain=chatPlaintext.get(card);
   if(plain){body.classList.toggle("masked");body.textContent=body.classList.contains("masked")?"••••••••••••••":plain;return;}
   if(!String(d.message||"").startsWith("ENC1:")){alert("This message is not encrypted.");return;}
   const password=prompt("Enter the numeric PIN used to encrypt this message.");
   if(password===null)return;
   if(!/^\d+$/.test(password)){alert("Use numbers only for the PIN.");return;}
   try{const decrypted=await decryptChatText(String(d.message),password);chatPlaintext.set(card,decrypted);body.textContent=decrypted;body.classList.remove("masked");}
   catch(err){alert("Could not decrypt. Check the PIN.");}
 };
 card.append(meta,body,eye);
 card.onclick=()=>{document.querySelectorAll(".chatmsg").forEach(x=>x.classList.remove("selected"));card.classList.add("selected");selectedChat={card,body,message:String(d.message||"")};};
 chatlog.append(card);chatlog.scrollTop=chatlog.scrollHeight;
}


/* ADD SPREADSHEET ROW */

function addRow(q,a,u){

 rowNumber++;

 const tr=document.createElement("tr");

 const rn=document.createElement("td");

 rn.className="rownum";

 rn.textContent=rowNumber;

 tr.append(rn);


 [
  [q,"query"],
  [a,"answer"],
  [u,"user"]
 ].forEach(([value,type])=>{

  const td=document.createElement("td");

  td.textContent=value||"";

  if(type!=="user"){

   td.contentEditable="true";

   td.className="cell-edit";

  }

  tr.append(td);

 });


 rows.append(tr);

}


/* SHOW AI RESULT */

function showAnswer(d){

 answer.innerHTML="";


 const card=document.createElement("div");

 card.className="card";


 const meta=document.createElement("div");

 meta.className="meta";

 meta.textContent=
 d.user+
 " · "+
 new Date(
  d.time||Date.now()
 ).toLocaleTimeString(
  [],
  {
   hour:"2-digit",
   minute:"2-digit"
  }
 );


 const question=document.createElement("b");

 question.textContent=d.query;


 const text=document.createElement("p");
 text.textContent="••••••••••";
 text.className="masked";
 let answerVisible=false;
 const eye=document.createElement("button");
 eye.className="eye";eye.type="button";eye.textContent="👁";
 eye.title="Show or hide AI answer";
 eye.onclick=()=>{
  answerVisible=!answerVisible;
  text.textContent=answerVisible?d.answer:"••••••••••";
  text.classList.toggle("masked",!answerVisible);
 };
 card.append(meta,question,text,eye);


 if(d.sources && d.sources.length){

  const sourceBox=document.createElement("div");

  sourceBox.className="sources";


  const title=document.createElement("b");

  title.textContent="Sources";

  sourceBox.append(title);


  d.sources.forEach(source=>{

   const link=document.createElement("a");

   link.href=source.url;

   link.target="_blank";

   link.rel="noopener noreferrer";

   link.textContent=
    "🔗 "+source.title;

   sourceBox.append(link);

  });


  card.append(sourceBox);

 }


 answer.append(card);

 answer.scrollTop=answer.scrollHeight;

}


/* CONNECTION */

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

 const d=JSON.parse(e.data);


 if(d.type==="history"){

  rows.innerHTML="";

  rowNumber=0;


  d.messages.forEach(x=>{

   if(x.type==="query"){
    addRow(x.query,x.answer,x.user);
   }
   if(x.type==="chat") addChatMessage(x);

  });

 }


 if(d.type==="query"){
  addRow(d.query,d.answer,d.user);
  showAnswer(d);
  askButton.disabled=false;
 }
 if(d.type==="chat") addChatMessage(d);


 if(d.type==="error"){

  answer.innerHTML="";

  const error=document.createElement("div");

  error.className="card";

  error.textContent=
   "Error: "+d.message;

  answer.append(error);

  askButton.disabled=false;

 }

};


/* ENCRYPTED SHARED CHAT */
document.querySelector("#encryptSend").onclick=async()=>{
 const input=document.querySelector("#chatinput");
 const message=input.value.trim();
 if(!message)return;
 if(ws.readyState!==1){alert("Not connected. Please wait.");return;}
 const password=prompt("Enter a numeric PIN. Everyone must use the same PIN to decrypt (one digit is allowed).");
 if(password===null)return;
 if(!/^\d+$/.test(password)){alert("Use numbers only for the PIN.");return;}
 try{
  const encrypted=await encryptChatText(message,password);
  if(ws.readyState!==WebSocket.OPEN){throw new Error("Chat connection closed. Refresh the page and try again.");}
  ws.send(JSON.stringify({type:"chat",user:name,message:encrypted}));
  input.value="";
 }catch(err){alert("Message could not be sent: "+err.message);}
};
document.querySelector("#chatinput").addEventListener("keydown",e=>{
 if(e.key==="Enter"){e.preventDefault();document.querySelector("#encryptSend").click();}
});
document.querySelector("#decryptSelected").onclick=async()=>{
 if(!selectedChat){alert("Select an encrypted message first.");return;}
 if(!selectedChat.message.startsWith("ENC1:")){alert("This message is not encrypted.");return;}
 const password=prompt("Enter the numeric PIN used to encrypt this message.");
 if(password===null)return;
 if(!/^\d+$/.test(password)){alert("Use numbers only for the PIN.");return;}
 try{
  const plain=await decryptChatText(selectedChat.message,password);
  chatPlaintext.set(selectedChat.card,plain);
  selectedChat.body.textContent=plain;
  selectedChat.body.classList.remove("masked");
 }catch(err){alert("Could not decrypt. Check the password or message.");}
};

/* ASK AI */

function askQuery(query){

 if(!query)return;

 if(ws.readyState!==1){

  alert("Not connected. Please wait.");

  return;

 }


 askButton.disabled=true;


 answer.innerHTML=
 '<div class="card">🔎 Searching the web and asking AI…</div>';


 document.querySelector("#q").value=query;

 document.querySelector("#m").value="";


 ws.send(
  JSON.stringify({
   type:"query",
   user:name,
   query:query
  })
 );

}


/* AI QUERY BOX */

document.querySelector("#form").onsubmit=e=>{

 e.preventDefault();

 const q=document
  .querySelector("#m")
  .value
  .trim();

 askQuery(q);

};


/* SPREADSHEET QUERY */

document.querySelector("#qb").onclick=()=>{

 const q=document
  .querySelector("#q")
  .value
  .trim();

 askQuery(q);

};


/* ENTER */

document.querySelector("#q").onkeydown=e=>{

 if(e.key==="Enter"){

  e.preventDefault();

  document.querySelector("#qb").click();

 }

};


/* ADD ROW */

document.querySelector("#add").onclick=()=>{

 addRow("","","");

};


/* CLEAR */

document.querySelector("#clear").onclick=()=>{

 if(confirm("Clear visible rows?")){

  rows.innerHTML="";

  rowNumber=0;

 }

};


/* MINIMIZE */

document.querySelector("#min").onclick=()=>{

 document.body.classList.add("min");

};


/* RESTORE */

document.querySelector("#restore").onclick=()=>{

 document.body.classList.remove("min");

};

</script>

</body>
</html>`;


export class ChatRoom extends DurableObject {

 constructor(ctx,env){

  super(ctx,env);

  this.ctx=ctx;

  this.env=env;


  this.ctx.storage.sql.exec(
   "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT,type TEXT,user TEXT,message TEXT,query TEXT,answer TEXT,created_at TEXT)"
  );

 }


 async fetch(request){

  if(
   request.headers.get("Upgrade")
   !==
   "websocket"
  ){

   return new Response(
    "Chat room is running."
   );

  }


  const pair=new WebSocketPair();

  const server=pair[1];

  this.ctx.acceptWebSocket(server);


  const history=
   this.ctx.storage.sql.exec(
    "SELECT type,user,message,query,answer,created_at FROM messages ORDER BY id DESC LIMIT 100"
   )
   .toArray()
   .reverse();


  server.send(
   JSON.stringify({
    type:"history",
    messages:history
   })
  );


  return new Response(null,{
   status:101,
   webSocket:pair[0]
  });

 }


 async webSocketMessage(ws,raw){

  try{

   const d=JSON.parse(raw);

   const user=
    String(
     d.user||"Guest"
    ).slice(0,40);

   const query=String(d.query||"").trim().slice(0,2000);

   if(d.type==="chat"){
    const message=String(d.message||"").slice(0,12000);
    if(!message)return;
    const time=new Date().toISOString();
    this.ctx.storage.sql.exec(
     "INSERT INTO messages(type,user,message,created_at) VALUES(?,?,?,?)",
     "chat",user,message,time
    );
    const output={type:"chat",user,message,time};
    for(const socket of this.ctx.getWebSockets()){try{socket.send(JSON.stringify(output));}catch{}}
    return;
   }

   if(d.type!=="query" || !query) return;


   let results=[];

   let aiAnswer="";


   /* WEB SEARCH */

   try{

    if(!this.env.TAVILY_API_KEY){

     throw new Error(
      "TAVILY_API_KEY is not configured in Cloudflare."
     );

    }


    const searchResponse=
     await fetch(
      "https://api.tavily.com/search",
      {
       method:"POST",

       headers:{
        "content-type":
        "application/json"
       },

       body:JSON.stringify({

        api_key:
        this.env.TAVILY_API_KEY,

        query:query,

        search_depth:"advanced",

        max_results:5,

        include_answer:false

       })

      }
     );


    if(!searchResponse.ok){

     throw new Error(
      "Web search failed: "+
      searchResponse.status
     );

    }


    const searchData=
     await searchResponse.json();


    results=
     (searchData.results||[])
     .map(x=>({

      title:x.title||"Web result",

      url:x.url||"",

      content:x.content||""

     }));


    /* CREATE CONTEXT FOR AI */

    const context=
     results
     .map(
      (x,i)=>
       `[${i+1}] ${x.title}
URL: ${x.url}
${x.content}`
     )
     .join("\n\n");


    /* AI */

    const aiResponse=
     await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {

       messages:[

        {
         role:"system",

         content:
         "You are a helpful AI web-search assistant. Answer the user's question using the supplied web search results. Be accurate and concise. Do not invent facts or sources. If the search results do not contain enough information, say so."
        },

        {
         role:"user",

         content:
         "Question:\n"+
         query+
         "\n\nWeb search results:\n"+
         context
        }

       ]

      }
     );


    aiAnswer=
     aiResponse.response
     ||
     aiResponse.result?.response
     ||
     "The AI did not return an answer.";


   }
   catch(error){

    aiAnswer=
     "AI Search error: "+
     error.message;

   }


   const time=
    new Date().toISOString();


   /* SAVE QUERY + ANSWER */

   this.ctx.storage.sql.exec(

    "INSERT INTO messages(type,user,query,answer,created_at) VALUES(?,?,?,?,?)",

    "query",

    user,

    query,

    aiAnswer,

    time

   );


   const output={

    type:"query",

    user:user,

    query:query,

    answer:aiAnswer,

    sources:
     results.map(x=>({

      title:x.title,

      url:x.url

     })),

    time:time

   };


   /* SHARE WITH EVERYONE */

   for(
    const socket
    of this.ctx.getWebSockets()
   ){

    try{

     socket.send(
      JSON.stringify(output)
     );

    }
    catch{}

   }


  }
  catch(error){

   try{

    ws.send(
     JSON.stringify({

      type:"error",

      message:
       error.message||
       "Query failed."

     })
    );

   }
   catch{}

  }

 }

}


export default {

 async fetch(request,env){

  const url=
   new URL(request.url);


  if(url.pathname==="/ws"){

   const room=
    url.searchParams.get("room")
    ||
    "demo";


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
