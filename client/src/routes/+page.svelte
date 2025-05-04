<script>
  import 'bootstrap/dist/css/bootstrap.min.css';
  
  import { onMount } from 'svelte';
  import cross from '$lib/cross.png'
  import Save from '$lib/save.png'
  import del from '$lib/del.png'
  import edit from '$lib/edit.png'
 
  let surveys = [];
  let categories = [];
  let uidCodes = [];
  let editMode = false;
  let currentSurvey = { id: null, object_name: '', object_name_abbreviation: '', object_category: '', uid_code_range: '' };
  let editingId = null;

  // Form fields
  let object_name = '';
  let object_name_abbreviation = '';
  let object_category = '';
  let uid_code_range = '';
  let new_category = '';
  let showCategoryInput = false; // Show/hide category input field
  let showAddSurveyForm = false; // Toggle visibility of the "Add New Survey" form



  function showToast() {
    if (browser) {
      toast.success("Toast message!");
    }
  }
  async function fetchSurveys() {
    try {
      const response = await fetch('http://localhost:3000/api/surveys');
      if (response.ok) {
        surveys = await response.json();
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  }

  
  async function fetchCategories() {
    try {
      const response = await fetch('http://localhost:3000/api/categories');
      if (response.ok) {
        categories = await response.json();
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchUidCodes() {
    try {
      const response = await fetch('http://localhost:3000/api/uid-codes');
      if (response.ok) {
        uidCodes = await response.json();
      }
    } catch (error) {
      console.error('Error fetching UID codes:', error);
    }
  }

  async function addCategory() {
    if (!new_category.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object_category: new_category })
      });

      if (response.ok) {
        const addedCategory = await response.json();
        categories = [...categories, addedCategory]; // Update UI
        object_category = addedCategory.id; // Select the newly added category
        new_category = '';
        showCategoryInput = false;
      } else {
        console.error('Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  }

 
  async function addSurvey() {
  if (!object_name || !object_name_abbreviation || !object_category || !uid_code_range) {
    alert('Please fill all fields');
    return;
  }
  try {
    const response = await fetch('http://localhost:3000/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ object_name, object_name_abbreviation, object_category, uid_code_range })
    });

    if (response.ok) {
      const newSurvey = await response.json();
      surveys = [...surveys, newSurvey]; // Add the new survey to the list
      // surveys.sort((a, b) => a.id - b.id); // Sort surveys by id to maintain order
      object_name = '';
      object_name_abbreviation = '';
      object_category = '';
      uid_code_range = '';
      showAddSurveyForm = false; // Hide form after submission
      
      
   
      await fetchSurveys(); // Refresh the survey table


    } else {
      console.error('Failed to add survey');
    }
  } catch (error) {
    console.error('Error adding survey:', error);
  }
}


  async function deleteCategory(id) {
  console.log('Attempting to delete category with ID:', id); // Check the ID being sent
  if (confirm('Are you sure you want to delete this category?')) {
    const response = await fetch(`http://localhost:3000/api/categories/${id}`, { method: 'DELETE' });
    if (response.ok) {
      categories = categories.filter(category => category.id !== id);
    } else {
      alert('Error deleting category');
      const data = await response.json();
      console.error('Error details:', data); // Log error details from the server
    }
  }
}
    async function deleteSurvey(id) {
        if (confirm('Are you sure you want to delete this survey?')) {
            const response = await fetch(`http://localhost:3000/api/surveys/${id}`, { method: 'DELETE' });
            if (response.ok) {
                surveys = surveys.filter(survey => survey.id !== id);
            }
        }
    }

    function editSurvey(survey) {
        editingId = survey.id;
          currentSurvey = { 
        id: survey.id,
        object_name: survey.object_name,
        object_name_abbreviation: survey.object_name_abbreviation,
        object_category: survey.object_category || "",  // Ensure it's correctly assigned
        uid_code_range: survey.uid_code_range || ""   // Ensure it's correctly assigned
    };
    console.log("Editing survey:", currentSurvey);
      }

  async function updateSurvey() {
    try {
      const res = await fetch(`http://localhost:3000/api/surveys/${currentSurvey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSurvey),
      });

      if (res.ok) {
        surveys = surveys.map(s => s.id === currentSurvey.id ? { ...currentSurvey } : s);
        editingId = null;
      } else {
        alert('Failed to update survey');
      }
      await fetchSurveys(); // Refresh the survey table

    } catch (error) {
      console.error('Error updating survey:', error);
    }
  }
  
  function closeForm() {
    showAddSurveyForm = false;
  }

  function cancelEdit() {
  editingId = null;
}

  onMount(() => {
    fetchSurveys();
    fetchCategories();
    fetchUidCodes();
  });


</script>

<div style="background:rgba(255,255,255,1); min-height: 45vh; left: 50%; overflow-y:auto ">
  <div style="text-center sm:text-center; justify-content:center; align-items:center;">
    <div style="color:black; display:flex; justify-content:center;">Manage Survey Object Codes</div>
  </div>
<!-- Table with Survey Data -->
<div style="overflow: auto;padding:20px; display:flex; justify-content:center;">
<table>
  <thead>
    <tr>
      <!-- <th >ID</th> -->
      <th>Object Category</th>
      <th>Object Name</th>
      <th>Object Abbreviation</th>
      <th>UID Code Range</th>
      <th>UID Code Class</th>
      <th colspan="2">Actions</th>
    </tr>
  </thead>
  <tbody>
    {#each surveys as survey}
    <tr>
        {#if editingId === survey.id}
        <!-- <td>{survey.id}</td> -->
        <td>
          <select bind:value={currentSurvey.object_category}>
            <option value={currentSurvey.object_category} disabled>Select Category</option>
            {#each categories as category}
              <option value={category.id}>{category.object_category}</option>
            {/each}
          </select>
        </td>
        <td><input type="text" bind:value={currentSurvey.object_name} /></td>
        <td><input type="text" bind:value={currentSurvey.object_name_abbreviation} /></td>
        <td></td>
        <td>
          <select bind:value={currentSurvey.uid_code_range}>
            <!-- <option value={currentSurvey.uid_code_range}>{currentSurvey.uid_code_range}</option> -->
            <option value={currentSurvey.uid_code_range} disabled>Select category</option>

            {#each uidCodes as code}
              <option value={code.uid_code_class} >{code.uid_code_class}</option>
            {/each}
          </select>
        </td>
          <td><button on:click={updateSurvey}>
          <img src={Save} alt="" style="width:20px;"></button></td>
          <td> <button on:click={cancelEdit}>
          <img src={cross} alt="" style="width:20px;"></button></td>
          {:else}
        <!-- Show normal row when not editing -->
        <!-- <td>{survey.id}</td> -->
        <td>{survey.object_category}</td>
        <td>{survey.object_name}</td>
        <td>{survey.object_name_abbreviation}</td>
        <td>{survey.uid_code_range}</td>
        <td>{survey.uid_code_class}</td>
        <td><button on:click={() => deleteSurvey(survey.id)}>
          <img src={del} alt="" style="width:20px;"></button></td>
        <td><button on:click={() => editSurvey(survey)}>
        <img src={edit} alt="" style="width:20px;"></button></td>
      {/if}
    </tr>
  {/each}
  </tbody>
</table>
</div>
<!-- Button to Add New Survey -->
<div class="table-footer">
  <button class="add-survey-btn" on:click={() => showAddSurveyForm = !showAddSurveyForm}>
    {showAddSurveyForm ? 'Cancel' : 'Add New Survey'}
  </button>
</div>
</div>

<!-- Add Survey Form in Modal -->
{#if showAddSurveyForm}
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="header-add">
        <h4>Add New Survey</h4>
      </div>
      <div class="form-data">
      <form on:submit|preventDefault={addSurvey}>

        <div class="form-row">
          <label>Object Category:</label>
            <select style="width:105%" bind:value={object_category} required>
              <option value="" disabled>Select category</option>
              {#each categories as category}
                <option value={category.id}>{category.object_category}</option>
              {/each}
              <option value="add_new" style="font-weight: 600;">+ Add New Category</option>
              <option value="delete_category" style="font-weight: 600;">Delete Selected Category</option> <!-- New option to delete -->
            </select>
        </div>

        {#if object_category === 'delete_category'}
        <div class="table-container" style="height: 200px; overflow-y:auto;">
          <button class="close-button" style="color: black;" on:click={() => object_category = null}>
            <img src={cross} alt="" style="width:20px;"></button>
          <div style="display:flex; justify-content:center;">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Object Category</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {#each categories as category}
                <tr>
                  <td>{category.id}</td>
                  <td>{category.object_category}</td>
                  <td><button on:click={() => deleteCategory(category.id)}>
                    <img src={del} alt="" style="width:20px;"></button></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        </div>
      {/if}
        {#if object_category === 'add_new'}
          <div class="form-row">
            <label>New Category:</label>
            <input type="text"  bind:value={new_category} placeholder="Enter new category" />
          </div>
           <div class="form-buttons" style="align-items: center; margin-bottom: 15px; ">
            <button type="button" style="background-color: #35a7c4; border:none; padding:10px; border-radius:3px; color:white;" on:click={addCategory}>Save</button>
           </div>
           
        {/if}
        <div class="form-row">
          <label for="object_name">Object Name:</label>
          <input id="object_name" type="text" bind:value={object_name} required />
        </div>

        <div class="form-row">
          <label for="object_name_abbreviation">Object Abbreviation:</label>
          <input id="object_name_abbreviation" type="text" bind:value={object_name_abbreviation} required />
        </div>
        
          <div class="form-row">
            <label for="uid_code_range">UID Code Class:</label>
            <select id="uid_code_range" style="width:105%" bind:value={uid_code_range} required>
              <option value="" disabled>Select UID Code</option>
              {#each uidCodes as code}
                <option value={code.uid_code_class}>{code.uid_code_class}</option>
              {/each}
            </select>
          </div>
          
        <div class="form-buttons">
          <button class="form-btn" type="submit"  >Add Survey</button>
          <button class="form-btn" type="button" on:click={closeForm}>Cancel</button>
        </div>
      </form>
    </div>
    </div>
  </div>
{/if}

<!-- <button on:click={showToast}>Show Toast</button> -->




<style>
  /* Table Styles */  
  *{
    font-family: Inter, sans-serif;
    
  }
  table {
    width: auto;
    border-collapse: collapse;
    font-size: small;
    border: 2px solid black;
    
  }
  table th {
    border: 1.2px solid black; 
    padding: 5px; 
    text-align: center;
  }
  table td {
    border: 1px solid black;
     text-align: center;
  }


  /* Footer Button Styling */
  .table-footer {
    display: flex;
    justify-content:center;
  }

  .add-survey-btn {
    background-color: #35a7c4;
    color: white;
    padding: 7px 0px;
    width: 120px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 15px;
    display: inline-block;
    transition: all 0.3s ease;
  
  }
  .form-btn{
    background-color: #35a7c4;
    color:white;
    padding: 7px 0px;
    width: 120px;
    border:none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 15px;
  }

  .add-survey-btn:hover {
    background-color: #35a7c4;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: small;
  }

  .modal-content {
    background-color: white;
    /* padding: 20px; */
    padding-top: 0%;
    /* margin-top: 0%; */
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    width: 400px;
  }

  /* Form Styling */
  form {
    display: flex;
    flex-direction: column;
    
  }
  .form-row {
  display: flex;
  align-items: center; /* Aligns the label and input vertically */
  margin-bottom: 15px;
  }

.form-row label {
  font-weight: bold;
  color: #333;
  width: 266px; /* Fixed width for labels to align them all */
  margin-right: 10px; /* Space between label and input */
}

  /* label {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  font-weight: bold;
  color: #333;
  width: 100%; 
  max-width: 500px; 
  } */

.form-row input,
.form-row select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  width: 100%; /* Makes inputs span the remaining space */
  max-width: 400px; /* Optional: Limit input width */
}
/* label input,
label select {
  margin-left: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  width: 100%;
  width: 100%;
  max-width: 300px;
  max-width: 300px; 
}
form label input,
form label select {
  width: 100%;
} */

.form-row input:focus,
.form-row select:focus {
  border-color: #007bff;
  outline: none;
}
  button:hover {
    background: #35a7c4;
  }

 

  /* Form Button Layout */
  .form-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  .header-add {
    background-color: rgb(246, 246, 247);
    color: black;
    /* background-color: #007bff; */
    margin: 0px;
    padding: 0px;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }
  h4{
      margin: 0px;
      padding: 8px;
      display: flex
;     justify-content: center;
      
    }
  .form-data{
    padding: 20px;
  }

  .table-container {
    position: relative;
    padding: 10px;
    border: 1px solid #ddd;
    background: white;
    display: inline-block;
    align-items: center;
  }

  .close-button {
    position: absolute;
    top: 5px;
    right: 5px;
    color: white;
    border: none;
    padding: 5px 8px;
    cursor: pointer;
    font-size: 14px;
    border-radius: 4px;
  }


</style>
