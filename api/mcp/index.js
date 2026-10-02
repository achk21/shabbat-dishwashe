import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { hc } from "../../lib/homeconnect.js";

async function snapshot(){
 const all=await hc("/homeappliances");
 const appliances=all?.data?.homeappliances||[];
 const d=appliances.find(x=>String(x.type).toLowerCase()==="dishwasher");
 if(!d) throw new Error("Dishwasher not found");
 const id=encodeURIComponent(d.haId);
 const [s,p]=await Promise.all([hc(`/homeappliances/${id}/status`),hc(`/homeappliances/${id}/programs/available`)]);
 const list=s?.data?.status||[];
 const val=k=>list.find(x=>x.key===k)?.value;
 return {
  appliance:{name:d.name,type:d.type,connected:d.connected},
  remoteStartAllowed:val("BSH.Common.Status.RemoteControlStartAllowed"),
  remoteControlActive:val("BSH.Common.Status.RemoteControlActive"),
  door:val("BSH.Common.Status.DoorState"),
  operationState:val("BSH.Common.Status.OperationState"),
  selected:p?.data?.selected?.key||null,
  programs:(p?.data?.programs||[]).map(x=>({key:x.key,name:x.name,execution:x?.constraints?.execution}))
 };
}

function server(){
 const s=new McpServer({name:"shabbat-dishwasher",version:"0.2.0"});
 s.tool("get_dishwasher_status","Read the current Home Connect dishwasher state. Read-only.",{},async()=>({
  content:[{type:"text",text:JSON.stringify(await snapshot(),null,2)}]
 }));
 s.tool("get_dishwasher_programs","List programs currently available for remote selection/start. Read-only.",{},async()=>{
  const x=await snapshot(); return {content:[{type:"text",text:JSON.stringify({selected:x.selected,programs:x.programs},null,2)}]};
 });
 s.tool("check_start_readiness","Check whether remote-control prerequisites currently look ready. This never starts the dishwasher.",{},async()=>{
  const x=await snapshot();
  const ready=x.appliance.connected===true&&x.remoteStartAllowed===true&&x.remoteControlActive===true&&String(x.door).endsWith(".Closed")&&String(x.operationState).endsWith(".Ready");
  return {content:[{type:"text",text:JSON.stringify({ready,checks:{connected:x.appliance.connected,remoteStartAllowed:x.remoteStartAllowed,remoteControlActive:x.remoteControlActive,door:x.door,operationState:x.operationState},note:"Read-only check; no start command was sent."},null,2)}]};
 });
 return s;
}

export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({jsonrpc:"2.0",error:{code:-32600,message:"MCP endpoint accepts POST only"},id:null});
 const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined});
 const s=server();
 res.on("close",()=>{transport.close();s.close();});
 await s.connect(transport);
 await transport.handleRequest(req,res,req.body);
}
