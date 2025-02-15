import Order from "../models/order.model.js"

import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_KEY });

const monthXprice = async (req, res) => {
    try {
      // Fetch only purchase_date and price from all orders in MongoDB
      const orders = await Order.find({}, { purchase_date: 1, price: 1, _id: 0 });
  
      // Check if data exists
      if (!orders || orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No order data found.",
        });
      }
  
      // Initialize an object to store total price for each month
      const monthlyPrices = {
        January: 0,
        February: 0,
        March: 0,
        April: 0,
        May: 0,
        June: 0,
        July: 0,
        August: 0,
        September: 0,
        October: 0,
        November: 0,
        December: 0,
      };
  
      // Iterate through orders and sum prices by month
      orders.forEach((order) => {
        if (order.purchase_date && order.price) {
          const monthIndex = new Date(order.purchase_date).getMonth(); // Get month index (0-11)
          const monthNames = Object.keys(monthlyPrices);
          const monthName = monthNames[monthIndex];
          monthlyPrices[monthName] += order.price; // Sum up prices for the corresponding month
        }
      });
  
      // Convert monthly price object into an array of values in order from Jan to Dec
      const priceArray = Object.values(monthlyPrices);
  
      // Convert MongoDB data into the required format for LLM
      const formattedData = orders.map((order) => ({
        purchase_date: order.purchase_date,
        price: order.price,
      }));
  
      // Convert JSON to a properly formatted string for LLM
      const formattedJson = JSON.stringify(formattedData, null, 2);
  
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `You are a data analyst expert. I need you to analyze the following JSON data and generate **brief, data-driven insights** based on the relationship between **purchase_date** and **price**.
                      - Identify **trends** in purchase amounts over time.
                      - Highlight **peak spending periods** or noticeable **drops**.
                      - Detect any **seasonal patterns** or significant fluctuations in pricing.
                      - Provide insights on **high-value vs low-value purchase trends**.
  
                      ### **STRICT RESPONSE GUIDELINES:**  
                      ✅ **Return output strictly in HTML format** for easy rendering.  
                      ❌ **Do NOT include any JavaScript, charts, or CSS styling.**  
                      ❌ **Do NOT add any generic explanations or disclaimers.**  
  
                      Here is the JSON data:
                      \n\`\`\`json\n${formattedJson}\n\`\`\`
  
                      The output should be structured using only **HTML elements (e.g., <h2>, <p>, <ul>, <li>)** and contain **only the insights** related to the given data.
                      `,
          },
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 1024,
      });
  
      return res.status(200).json({
        success: true,
        response:
          completion.choices[0]?.message?.content || "No response generated",
        chart: priceArray, // Array of total prices per month (Jan to Dec)
      });
    } catch (error) {
      console.error("Error during AI chat generation:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  };

// pie chart
const categoryPie = async (req, res) => {
    try {
      // Fetch only category from all orders in MongoDB
      const orders = await Order.find({}, { category: 1, _id: 0 });
  
      // Check if data exists
      if (!orders || orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No category data found.",
        });
      }
  
      // Create a frequency counter for categories
      const categoryCount = {};
  
      orders.forEach((order) => {
        if (order.category) {
          categoryCount[order.category] = (categoryCount[order.category] || 0) + 1;
        }
      });
  
      // Convert category count object to array of values (occurrences per category)
      const categoryArray = Object.values(categoryCount);
  
      // Convert MongoDB data into the required format for LLM
      const formattedData = orders.map((order) => ({
        category: order.category,
      }));
  
      // Convert JSON to a properly formatted string for LLM
      const formattedJson = JSON.stringify(formattedData, null, 2);
  
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `You are a data analyst expert. I need you to analyze the following JSON data and generate **brief, data-driven insights** based on the **category** attribute.
                      - Identify **top categories** with the highest purchase frequency.
                      - Highlight **least purchased categories**.
                      - Provide percentage distribution of categories.
                      - Detect any notable **patterns or trends** in category preferences.
  
                      ### **STRICT RESPONSE GUIDELINES:**  
                      ✅ **Return output strictly in HTML format** for easy rendering.  
                      ❌ **Do NOT include any JavaScript, charts, or CSS styling.**  
                      ❌ **Do NOT add any generic explanations or disclaimers.**  
  
                      Here is the JSON data:
                      \n\`\`\`json\n${formattedJson}\n\`\`\`
  
                      The output should be structured using only **HTML elements (e.g., <h2>, <p>, <ul>, <li>)** and contain **only the insights** related to the given data.
                      `,
          },
        ],
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 1024,
      });
  
      return res.status(200).json({
        success: true,
        response:
          completion.choices[0]?.message?.content || "No response generated",
        chart: categoryArray, // Array of category occurrences
      });
    } catch (error) {
      console.error("Error during AI chat generation:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  };

  

// multiline graph
const genderXcategory = async (req, res) => {
  try {
    const { msg } = req.body;
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `You are a data analyst expert. I need you to take the following json data and generate data points to create a multi-line chart.
                              where x-axis will have gender and the y-axis will have category attribute. Where there will be 2 lines drawn for male and female, give data points for this.
                              The data should be taken from the json provided below 
                              Description: ${msg}`,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 1024,
    });

    return res.status(200).json({
      success: true,
      response:
        completion.choices[0]?.message?.content || "No response generated",
    });
  } catch (error) {
    console.error("Error during AI chat generation : ", error);
  }
};

export { monthXprice, categoryPie, genderXcategory };
