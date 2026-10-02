export default function handler(req,res){
 res.status(200).json({
  schema_version:"v1",
  name_for_human:"מדיח שבת",
  name_for_model:"shabbat_dishwasher",
  description_for_human:"קריאת מצב מדיח Home Connect ותכנון הפעלות מאושרות מראש.",
  description_for_model:"Read dishwasher state and available programs. Current API is read-only; never claim a dishwasher was started.",
  auth:{type:"none"},
  api:{type:"openapi",url:"https://shabbat-dishwashe.vercel.app/api/openapi"},
  logo_url:"https://shabbat-dishwashe.vercel.app/favicon.ico",
  contact_email:"support@example.com",
  legal_info_url:"https://shabbat-dishwashe.vercel.app/"
 });
}
