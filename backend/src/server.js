import express from "express"
import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import { favoritesTable } from "./db/schema.js";
import { eq, and } from "drizzle-orm";
import job from "./config/cron.js";

const app= express();
const PORT=ENV.PORT || 5001;

if (ENV.NODE_ENV==="production") job.start()

app.use(express.json());

app.get("/api/health", (req,res)=>{
    res.status(200).json({success:true})
});


app.post("/api/favorites",async(req,res)=>{
    try {
        const { userId, receipeId, title, image, cookTime, servings}=req.body;

        if(!userId || !receipeId || !title){
            return res.status(400).json({error: "Missing required fields"});
        }
        const newfavorite = await db.insert(favoritesTable).values({
            userId,
            receipeId,
            title,
            image,
            cookTime,
            servings
        }).returning();  //if we don't pass anything to returning() thrn it will return everything

        res.status(201).json(newfavorite[0]);
    } catch (error) {
        console.log("Error adding favorite", error);
        res.status(500).json({error:"Something went wrong"})
    }
});

app.get("/api/favorites/:userId/", async(req,res)=>{
    try {
        const {userId}=req.params;

        const userFavorites = await db.select().from(favoritesTable).where(eq(favoritesTable.userId, userId))

        res.status(200).json(userFavorites);
        
    } catch (error) {
        console.log("Error fetching the favorites", error);
        res.status(500).json({ error: "Something went wrong" });
    }
})

app.delete("/api/favorites/:userId/:receipeId", async (req, res) => {
  try {
    const { userId, receipeId } = req.params;

    await db
      .delete(favoritesTable)
      .where(
        and(eq(favoritesTable.userId, userId), eq(favoritesTable.receipeId, parseInt(receipeId)))
      );

    res.status(200).json({ message: "Favorite removed successfully" });
  } catch (error) {
    console.log("Error removing a favorite", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, ()=>{
    console.log("Server is running on PORT :", PORT);
});