export default function handler(req,res){
 const origin="https://shabbat-dishwashe.vercel.app";
 res.status(200).json({
  openapi:"3.1.0",
  info:{title:"Shabbat Dishwasher Agent API",version:"0.1.0",description:"Read-only Home Connect dishwasher API. Scheduling and start actions will be added only with explicit approval."},
  servers:[{url:origin}],
  paths:{
   "/api/agent/dishwasher":{
    get:{
     operationId:"getDishwasherState",
     summary:"Read dishwasher state and available programs",
     responses:{"200":{description:"Current dishwasher state",content:{"application/json":{schema:{type:"object"}}}}}
    }
   }
  }
 });
}
