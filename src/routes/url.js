const express = require("express");
const router = express.Router();


 const rateLimiter = require("../middlewares/rateLimiter");
 const Url = require("../db/url");
const { nanoid } = require("nanoid");
 

// Endpoint: shorten a URL
router.post("/shorten", rateLimiter, async (req, res) => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "originalUrl is required" });
  }

  // Use a loop to retry on duplicate key errors
  for (let i = 0; i < 20; i++) { // Retry up to 5 times
    try {
      // Generate a new slug for each attempt

    const slug = `${Date.now().toString(36)}-${nanoid(4)}`;

      const newUrl = new Url({
        slug,
        originalUrl,
        clicks: 0,
      });

      await newUrl.save();

      return res.json({
        slug,
        shortUrl: `http://localhost:${process.env.PORT || 5000}/${slug}`,
      });
    } catch (err) {
      // Check for the specific duplicate key error
      if (err.code === 11000) {
        // Log the collision and retry the loop
        console.warn(`Slug collision detected, retrying... Attempt ${i + 1}`);
        continue;
      }
      // Handle other server errors
      console.error("Error in shorten endpoint:", err.message);
      return res.status(500).json({ error: "Server error" });
    }
  }

  // If the loop completes without success, return a specific error
  res.status(500).json({ error: "Failed to generate a unique slug after multiple retries" });
});;

// Endpoint: redirect short slug to original URL
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;

  // find the document
  const entry = await Url.findOne({ slug });

  if (!entry) {
    return res.status(404).json({ error: "URL not found" });
  }

  // increment click count in DB
  entry.clicks += 1;
  await entry.save();

  console.log(`[Redirect] slug: ${slug} | url: ${entry.originalUrl} | totalClicks: ${entry.clicks} | at: ${new Date().toISOString()}`);

  res.redirect(entry.originalUrl);
});

// Endpoint: analytics
router.get("/admin/analytics/:slug", async (req, res) => {
  const { slug } = req.params;
  const key = req.headers["x-admin-key"];

  // security check
  if (key !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // fetch from Mongo
  const entry = await Url.findOne({ slug });

  if (!entry) {
    return res.status(404).json({ error: "URL not found" });
  }

  res.json({
    slug: entry.slug,
    originalUrl: entry.originalUrl,
    clicks: entry.clicks,
  });
});
router.get("/admin/total-clicks", async (req, res) => {
  try {
    const key = req.headers["x-admin-key"];

    if (key !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Aggregation: get total clicks per slug
    const totals = await Url.aggregate([
      {
        $project: {
          slug: 1,
          clicks: 1
        }
      }
    ]);

    res.json({ totals });
  } catch (err) {
    console.error("Error in total clicks endpoint:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
