// import express, { Request, Response } from 'express';
import { Client } from 'pg';
import cors from 'cors';
import express from 'express';
import { Request, Response } from 'express';


const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Setup PostgreSQL client with database credentials
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'manage_survey',
});

client.connect().catch(err => console.error('Connection error', err.stack));

// Fetch survey data
app.get('/api/surveys', async (req: Request, res: Response) => {
  try {
    const result = await client.query(
      `SELECT s.id, s.object_name, s.object_name_abbreviation, o.object_category, u.uid_code_range, u.uid_code_class 
       FROM survey s 
       JOIN object_categories o ON s.object_category = o.id 
       JOIN uid_code u ON s.uid_code_range = u.uid_code_class
       ORDER BY s.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching survey data:', error);
    res.status(500).send('Failed to fetch survey data.');
  }
});

// Fetch object categories for the dropdown
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const result = await client.query('SELECT id, object_category FROM object_categories');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Failed to fetch categories.');
  }
});

// Insert a new object category
app.post('/api/categories', async (req: Request, res: Response): Promise<void> => {
  const { object_category } = req.body;

  if (!object_category) {
    res.status(400).send('Category name is required.');
    return;
  }

  try {
    const result = await client.query(
      'INSERT INTO object_categories (object_category) VALUES ($1) RETURNING *',
      [object_category]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).send('Failed to add category.');
  }
});

// Delete a category
app.delete('/api/categories/:id', async (req: Request, res: Response): Promise<void>  => {
  const { id } = req.params;
  try {
    const result = await client.query('SELECT * FROM object_categories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return ;
    }
    await client.query('DELETE FROM object_categories WHERE id = $1', [id]);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Error deleting category' });
  }
});

// Fetch UID code classes for the dropdown
app.get('/api/uid-codes', async (req: Request, res: Response) => {
  try {
    const result = await client.query('SELECT uid_code_class, uid_code_range FROM uid_code');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching UID codes:', error);
    res.status(500).send('Failed to fetch UID codes.');
  }
});

// Insert new survey data
app.post('/api/surveys', async (req: Request, res: Response): Promise<void>  => {
  const { object_name, object_name_abbreviation, object_category, uid_code_range } = req.body;
  if (!object_name || !object_name_abbreviation || !object_category || !uid_code_range) {
    res.status(400).send('All fields are required.');
    return;
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

// Delete a survey
app.delete('/api/surveys/:id', async (req: Request, res: Response): Promise<void>  => {
  const { id } = req.params;
  try {
    const result = await client.query('DELETE FROM survey WHERE id = $1', [id]);
    if (result.rowCount === 0) {
    res.status(404).json({ error: 'Survey not found' });
    return ;
    }
    res.status(200).json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update an existing survey (Edit Feature)
app.put('/api/surveys/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { object_name, object_name_abbreviation, object_category, uid_code_range } = req.body;

  try {
    const result = await client.query(
      `UPDATE survey
       SET object_name = $1, object_name_abbreviation = $2, object_category = $3, uid_code_range = $4 
       WHERE id = $5 
       RETURNING *`,
      [object_name, object_name_abbreviation, object_category, uid_code_range, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Survey not found' });
      return;
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
