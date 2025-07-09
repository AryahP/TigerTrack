
/**import express from "express"
const app = express();
import cors from "cors";
import {Users} from "./users"


app.use(cors());

app.get("/", (req, res) => {
    const { q } = req.query;
    console.log(q)
    const keys = ["first_name", "last_name", "email"]

    const search = (data) =>{
    return data.filter(
      (item)=>keys.some(key=>item[key].toLowerCase().includes(query)))
  }
    res.json(Users.splice(0, 10))
})

app.listen(5000, () => console.log("API is working!"))
*/