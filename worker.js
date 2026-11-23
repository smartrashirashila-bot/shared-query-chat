import { DurableObject } from "cloudflare:workers";

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shared AI Spreadsheet</title>

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
 grid-template-columns:minmax(0,1fr) 380px;
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

.gridwrap{
 flex:1;
 overflow:auto
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
 text-align:center
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

.c-query{width:34%}
.c-answer{width:48%}
.c-user{width:120px}

.cell-edit:focus{
 box-shadow:inset 0 0 0 2px #4d90fe;
 white-space:normal;
 overflow:visible
}

/* AI PANEL */

.ai{
 display:flex;
 flex-direction:column;
 border-left:1px solid #cfd4da;
 background:#fafafa;
 min-width:0
}

.aihead{
 padding:12px;
 border-bottom:1px solid #d8dce1;
 background:#fff
}

.aihead b{
 display:block;
 font-size:16px
}

.aihead span{
 font-size:11px;
 color:#777
}

.min{
 float:right;
 border:1px solid #ccc;
 background:#fff;
 border-radius:4px;
 padding:5px 8px;
 cursor:pointer
}

.answer{
 flex:1;
 overflow:auto;
 padding:12px
}

.card{
 background:#fff;
 border:1px solid #ddd;
 border-radius:8px;
 padding:10px;
 margin-bottom:10px;
 overflow-wrap:anywhere
}

.meta{
 font-size:11px;
 color:#777;
 margin-bottom:5px
}

.sources{
 margin-top:12px;
 border-top:1px solid #eee;
 padding-top:8px
}

.chatlog{height:150px;overflow:auto;padding:9px;border-top:1px solid #ddd;background:#f5f6f8}
.chatmsg{background:#fff;border:1px solid #d9dde3;border-radius:7px;padding:8px;margin:5px 0;overflow-wrap:anywhere}
.chatmsg.selected{outline:2px solid #4d90fe}
.chattools{display:flex;gap:6px;align-items:center;margin-top:5px}
.chattools button,.chatrow button{border:1px solid #c9ced6;background:#fff;border-radius:5px;padding:5px 9px;cursor:pointer}
.chatrow{display:flex;gap:6px;padding:8px;background:#fff;border-top:1px solid #ddd}
.chatrow input{flex:1;min-width:0;padding:8px;border:1px solid #ccc;border-radius:5px}
.eye{border:1px solid #ccc;background:#fff;border-radius:4px;padding:3px 7px;cursor:pointer;margin-left:7px}
.masked{filter:blur(5px);user-select:none}
.sources a{
 display:block;
 margin-top:7px;
 color:#1769aa;
 text-decoration:none
}

.ask{
 padding:10px;
 border-top:1px solid #ddd;
 background:#fff
}

.ask textarea{
 width:100%;
 height:85px;
 resize:none;
 padding:9px;
 border:1px solid #ccc;
 border-radius:6px;
 font:inherit
}

.askrow{
 display:flex;
 gap:7px;
 margin-top:7px
}

.ask button{
 flex:1;
 padding:10px 14px;
 border:0;
 border-radius:6px;
 background:#222;
 color:#fff;
 cursor:pointer
}

.ask button:disabled{
 opacity:.5
}

/* MINIMIZE */

#restore{
 display:none;
 position:fixed;
 right:14px;
 bottom:14px;
 z-index:20;
 border:1px solid #ccc;
 border-radius:20px;
 background:#fff;
 padding:10px 15px;
 box-shadow:0 3px 12px #0002;
 cursor:pointer;
 font-weight:bold
}

body.min main{
 grid-template-columns:1fr 0
}

body.min .ai{
 display:none
}

body.min #restore{
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

 .ai{
  position:fixed;
  inset:auto 0 0 0;
  height:48vh;
  border-left:0;
  border-top:1px solid #ddd
 }

 body.min .sheet{
  height:calc(100vh - 54px)
 }
}
</style>
</head>

<body>

<header>
<b>📊 Shared AI Spreadsheet</b>
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
 <button id="encryptSend" type="button" title="Encrypt and send">E</button>
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
 body.textContent=card.dataset.encrypted?"🔒 Encrypted message — select and press D to decrypt":String(d.message||"");
 body.className="masked";
 const eye=document.createElement("button");
 eye.className="eye";eye.type="button";eye.textContent="👁";
 eye.title="Show or hide message";
 eye.onclick=()=>{
   const plain=chatPlaintext.get(card);
   if(!plain){alert("Decrypt this message first using D.");return;}
   body.classList.toggle("masked");
   body.textContent=body.classList.contains("masked")?"••••••••••":plain;
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
 if(!/^\\d+$/.test(password)){alert("Use numbers only for the PIN.");return;}
 try{
  const encrypted=await encryptChatText(message,password);
  ws.send(JSON.stringify({type:"chat",user:name,message:encrypted}));
  input.value="";
 }catch(err){alert("Encryption failed: "+err.message);}
};
document.querySelector("#decryptSelected").onclick=async()=>{
 if(!selectedChat){alert("Select an encrypted message first.");return;}
 if(!selectedChat.message.startsWith("ENC1:")){alert("This message is not encrypted.");return;}
 const password=prompt("Enter the numeric PIN used to encrypt this message.");
 if(password===null)return;
 if(!/^\\d+$/.test(password)){alert("Use numbers only for the PIN.");return;}
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
