// server.js
const express = require('express');
const { Client } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Setup PostgreSQL client with database credentials
const client = new Client({
  host: 'localhost', // Replace with your database host if different
  port: 5432,        // Default PostgreSQL port
  user: 'postgres',  // Replace with your PostgreSQL username
  password: 'postgres', // Replace with your PostgreSQL password
  database: 'manage_survey', // Replace with your database name
});

// Connect to the PostgreSQL database
client.connect().catch(err => console.error('Connection error', err.stack));

// Fetch survey data
app.get('/api/surveys', async (req, res) => {
  try {
    const result = await client.query(
      `SELECT s.id, s.object_name, s.object_name_abbreviation, o.object_category, u.uid_code_range, u.uid_code_class 
       FROM survey s 
       JOIN object_categories o ON s.object_category = o.id 
       JOIN uid_code u ON s.uid_code_range = u.uid_code_class
       ORDER BY s.id` // Ensure the rows are ordered by the survey ID
    );
    res.json(result.rows); // Send the result as JSON
  } catch (error) {
    console.error('Error fetching survey data:', error);
    res.status(500).send('Failed to fetch survey data.');
  }
});
// Fetch object categories for the dropdown
app.get('/api/categories', async (req, res) => {
  try {
    const result = await client.query('SELECT id, object_category FROM object_categories');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Failed to fetch categories.');
  }
});
// Insert a new object category
app.post('/api/categories', async (req, res) => {
  const { object_category } = req.body;

  if (!object_category) {
    return res.status(400).send('Category name is required.');
  }

  try {
    const result = await client.query(
      'INSERT INTO object_categories (object_category) VALUES ($1) RETURNING *',
      [object_category]
    );
    res.json(result.rows[0]); // Return the newly inserted category
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).send('Failed to add category.');
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Check if the category exists before attempting deletion
    const result = await client.query('SELECT * FROM object_categories WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Perform deletion
    await client.query('DELETE FROM object_categories WHERE id = $1', [id]);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error); // Log the error for better debugging
    res.status(500).json({ error: 'Error deleting category' });
  }
});


// Fetch UID code classes for the dropdown
app.get('/api/uid-codes', async (req, res) => {
  try {
    const result = await client.query('SELECT uid_code_class, uid_code_range FROM uid_code');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching UID codes:', error);
    res.status(500).send('Failed to fetch UID codes.');
  }
});



// Insert new survey data
app.post('/api/surveys', async (req, res) => {
  const { object_name, object_name_abbreviation, object_category, uid_code_range } = req.body;

  if (!object_name || !object_name_abbreviation || !object_category || !uid_code_range) {
    return res.status(400).send('All fields are required.');
  }


  try {
    const result = await client.query(
      'INSERT INTO survey (object_name, object_name_abbreviation, object_category, uid_code_range) VALUES ($1, $2, $3, $4) RETURNING *',
      [object_name, object_name_abbreviation, object_category, uid_code_range]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting survey data:', error);
    res.status(500).send('Failed to insert survey data.');
  }
});


app.delete('/api/surveys/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query('DELETE FROM survey WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.status(200).json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**  Update an existing survey (Edit Feature) */
app.put('/api/surveys/:id', async (req, res) => {
  const { id } = req.params;
  const { object_name, object_name_abbreviation, object_category, uid_code_range } = req.body;

  // return;
 
  try {
    const result = await client.query(
      `UPDATE survey
       SET object_name = $1, object_name_abbreviation = $2, object_category = $3, uid_code_range = $4 
       WHERE id = $5 
       RETURNING *`,
      [object_name, object_name_abbreviation, object_category, uid_code_range, id]
    );
      console.log(req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.json({ message: 'Survey updated successfully', survey: result.rows[0] });
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});





// app.put('/api/surveys/:id', async (req, res) => {
//   const { id } = req.params;
//   let { object_name, object_name_abbreviation, object_category, uid_code_range } = req.body;

//   if (!object_name || !object_name_abbreviation || !object_category || !uid_code_range) {
//     return res.status(400).json({ error: 'All fields are required for updating.' });
//   }

//   // Convert object_category to an integer
//   object_category = parseInt(object_category, 10);
//   uid_code_range = parseInt(uid_code_range, 10);

//   if (isNaN(object_category) || isNaN(uid_code_range)) {
//     return res.status(400).json({ error: 'object_category and uid_code_range must be valid numbers.' });
//   }

//   try {
//     const result = await client.query(
//       'UPDATE survey SET object_name = $1, object_name_abbreviation = $2, object_category = $3, uid_code_range = $4 WHERE id = $5 RETURNING *',
//       [object_name, object_name_abbreviation, object_category, uid_code_range, id]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: 'Survey not found' });
//     }

//     res.status(200).json({ message: 'Survey updated successfully', survey: result.rows[0] });
//   } catch (error) {
//     console.error('Error updating survey:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//     console.log(error, "object_category and uid_code_range must be valid numbers.")
//   }
// });



// Add a new survey
// app.post('/api/surveys', async (req, res) => {
//   const { objectCategory, objectName, objectNameAbbreviation, uidCodeClass } = req.body;
//   try {
//     // Insert new survey data into the survey table
//     const result = await client.query(
//       `INSERT INTO survey (object_category, object_name, object_name_abbreviation, uid_code_class)
//       VALUES ($1, $2, $3, $4) RETURNING *`,
//       [objectCategory, objectName, objectNameAbbreviation, uidCodeClass]
//     );
//     res.status(201).json(result.rows[0]); // Return the inserted survey data
//   } catch (error) {
//     console.error('Error inserting survey data:', error);
//     res.status(500).send('Failed to add survey data.');
//   }
// });