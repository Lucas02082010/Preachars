const express=require("express");
const session=require("express-session");
const multer=require("multer");
const fs=require("fs"),path=require("path");

const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_USER=process.env.ADMIN_USER||"admin";
const ADMIN_PASS=process.env.ADMIN_PASS||"preachers2026";
const DISCORD_TOKEN=process.env.DISCORD_TOKEN||"";
const DISCORD_INVITE=process.env.DISCORD_INVITE_URL||"INDSÆT-DIN-PREACHERS-DISCORD-INVITE";
const PUBLIC=path.join(__dirname,"public"),UPLOADS=path.join(PUBLIC,"uploads"),DATA=path.join(__dirname,"data.json");
fs.mkdirSync(UPLOADS,{recursive:true});
if(!fs.existsSync(DATA))fs.writeFileSync(DATA,JSON.stringify({members:[],gallery:[],applications:[],nextId:1},null,2));
const read=()=>JSON.parse(fs.readFileSync(DATA,"utf8")),write=d=>fs.writeFileSync(DATA,JSON.stringify(d,null,2));

app.use(express.json({limit:"2mb"}));app.use(express.urlencoded({extended:true}));
app.use(session({secret:process.env.SESSION_SECRET||"CHANGE-ME-PREACHERS-SECRET",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:false,maxAge:8*60*60*1000}}));
const storage=multer.diskStorage({destination:(q,f,cb)=>cb(null,UPLOADS),filename:(q,f,cb)=>cb(null,Date.now()+"-"+Math.random().toString(36).slice(2)+path.extname(f.originalname).toLowerCase())});
const upload=multer({storage,limits:{fileSize:10*1024*1024},fileFilter:(q,f,cb)=>/^image\/(jpeg|png|gif|webp)$/i.test(f.mimetype)?cb(null,true):cb(new Error("Kun billedfiler er tilladt."))});
const admin=(req,res,next)=>req.session.admin===true?next():res.status(401).json({error:"Du er ikke logget ind som admin."});

app.get("/api/health",(q,r)=>r.json({ok:true}));
app.post("/api/login",(q,r)=>{const{username,password}=q.body||{};if(String(username)===ADMIN_USER&&String(password)===ADMIN_PASS){q.session.admin=true;return q.session.save(()=>r.json({ok:true}))}r.status(401).json({error:"Forkert brugernavn eller adgangskode."})});
app.post("/api/logout",(q,r)=>q.session.destroy(()=>r.json({ok:true})));

app.get("/api/members",(q,r)=>r.json(read().members.map(x=>({...x,image_url:x.image?"/uploads/"+x.image:null}))));
app.post("/api/members",admin,upload.single("image"),(q,r)=>{const{name,rank}=q.body||{};if(!name||!rank)return r.status(400).json({error:"Navn og rang skal udfyldes."});const d=read();d.members.push({id:d.nextId++,name,rank,image:q.file?.filename||null});write(d);r.json({ok:true})});
app.get("/api/gallery",(q,r)=>r.json(read().gallery.map(x=>({id:x.id,url:"/uploads/"+x.file}))));
app.post("/api/gallery",admin,upload.single("image"),(q,r)=>{if(!q.file)return r.status(400).json({error:"Vælg et billede."});const d=read();d.gallery.unshift({id:d.nextId++,file:q.file.filename});write(d);r.json({ok:true})});

app.post("/api/applications",(q,r)=>{const{name,discord,discordId,age,experience,why}=q.body||{};if(!name||!discordId||!age||!experience||!why)return r.status(400).json({error:"Udfyld alle påkrævede felter, inklusive Discord User ID."});if(!/^\d{17,20}$/.test(String(discordId)))return r.status(400).json({error:"Discord User ID skal være 17-20 cifre."});const d=read();d.applications.unshift({id:d.nextId++,name,discord:discord||"",discordId:String(discordId),age,experience,why,status:"Afventer",dmStatus:"",createdAt:new Date().toISOString()});write(d);r.json({ok:true})});
app.get("/api/applications",admin,(q,r)=>r.json(read().applications));

async function sendDiscordDM(discordId,name){
 if(!DISCORD_TOKEN) return {ok:false,message:"Discord-bot er ikke konfigureret (DISCORD_TOKEN mangler)."};
 if(DISCORD_INVITE.startsWith("INDSÆT-")) return {ok:false,message:"Discord-invitation mangler (DISCORD_INVITE_URL)."};
 const msg=`🎉 **Tillykke, ${name}!**\n\nDin ansøgning til **PREACHERS** er blevet godkendt.\n\n🔗 **PREACHERS Discord:** ${DISCORD_INVITE}\n\nVelkommen til fællesskabet!`;
 const headers={"Authorization":"Bot "+DISCORD_TOKEN,"Content-Type":"application/json"};
 const u=await fetch("https://discord.com/api/v10/users/@me/channels",{method:"POST",headers,body:JSON.stringify({recipient_id:String(discordId)})});
 if(!u.ok){const t=await u.text();return {ok:false,message:"Kunne ikke åbne DM til Discord-brugeren. Discord kan blokere DMs eller User ID kan være forkert. "+t.slice(0,180)}}
 const ch=await u.json();
 const m=await fetch(`https://discord.com/api/v10/channels/${ch.id}/messages`,{method:"POST",headers,body:JSON.stringify({content:msg})});
 if(!m.ok){const t=await m.text();return {ok:false,message:"Discord kunne ikke sende DM. "+t.slice(0,180)}}
 return {ok:true,message:"Godkendt og Discord-DM sendt."};
}

app.patch("/api/applications/:id",admin,async(q,r)=>{
 const status=q.body?.status;if(!["Afventer","Godkendt","Afvist"].includes(status))return r.status(400).json({error:"Ugyldig status."});
 const d=read(),a=d.applications.find(x=>x.id===Number(q.params.id));if(!a)return r.status(404).json({error:"Ansøgningen findes ikke."});
 a.status=status;
 if(status==="Godkendt"){const dm=await sendDiscordDM(a.discordId,a.name);a.dmStatus=dm.message}
 else a.dmStatus="Ansøgningen er afvist.";
 write(d);
 r.json({ok:true,message:a.dmStatus});
});

app.use(express.static(PUBLIC));app.use((q,r)=>r.sendFile(path.join(PUBLIC,"index.html")));
app.listen(PORT,()=>console.log("PREACHERS kører på http://localhost:"+PORT));