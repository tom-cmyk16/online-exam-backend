// Test script for enhanced exam edit/delete functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  username: 'testinstructor',
  password: 'password123'
};

let authToken = '';
let testExamId = '';

async function login() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    
    const data = await response.json();
    if (data.token) {
      authToken = data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function createTestExam() {
  try {
    const examData = {
      university: 'Test University',
      title: 'Test Exam for Edit/Delete',
      description: 'This is a test exam to verify edit/delete functionality',
      duration: 60,
      weight: 50
    };

    const response = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(examData),
    });
    
    const data = await response.json();
    if (response.ok) {
      testExamId = data._id;
      console.log('✅ Test exam created:', data.title, 'ID:', testExamId);
      return true;
    } else {
      console.log('❌ Failed to create test exam:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Create exam error:', error.message);
    return false;
  }
}

async function testEditPermissions() {
  try {
    const response = await fetch(`${BASE_URL}/exams/${testExamId}/edit-permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Edit permissions check successful');
      console.log('   Can edit exam:', data.permissions.canEditExam);
      console.log('   Can delete exam:', data.permissions.canDeleteExam);
      console.log('   Can edit questions:', data.permissions.canEditQuestions);
      return data.permissions.canEditExam;
    } else {
      console.log('❌ Edit permissions check failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Edit permissions error:', error.message);
    return false;
  }
}

async function testValidateEdit() {
  try {
    const updateData = {
      title: 'Updated Test Exam Title',
      description: 'Updated description',
      duration: 90,
      weight: 75
    };

    const response = await fetch(`${BASE_URL}/exams/${testExamId}/validate-edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updateData),
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Validation check successful');
      console.log('   Is valid:', data.isValid);
      console.log('   Errors:', data.errors);
      console.log('   Warnings:', data.warnings);
      return data.isValid;
    } else {
      console.log('❌ Validation check failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Validation error:', error.message);
    return false;
  }
}

async function testUpdateExam() {
  try {
    const updateData = {
      title: 'Updated Test Exam Title',
      description: 'Updated description with enhanced functionality',
      duration: 90,
      weight: 75
    };

    const response = await fetch(`${BASE_URL}/exams/${testExamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updateData),
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Exam update successful');
      console.log('   Updated title:', data.title);
      console.log('   Updated duration:', data.duration);
      return true;
    } else {
      console.log('❌ Exam update failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Update exam error:', error.message);
    return false;
  }
}

async function testDeleteExam() {
  try {
    const response = await fetch(`${BASE_URL}/exams/${testExamId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Exam deletion successful');
      console.log('   Deleted exam:', data.deletedExam?.title);
      return true;
    } else {
      console.log('❌ Exam deletion failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Delete exam error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Enhanced Exam Edit/Delete Tests...\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Create test exam
  const createSuccess = await createTestExam();
  if (!createSuccess) {
    console.log('❌ Cannot proceed without test exam');
    return;
  }
  
  // Step 3: Test edit permissions
  console.log('\n📋 Testing edit permissions...');
  const hasPermissions = await testEditPermissions();
  
  // Step 4: Test validation
  console.log('\n🔍 Testing validation...');
  const isValid = await testValidateEdit();
  
  // Step 5: Test update
  if (hasPermissions && isValid) {
    console.log('\n✏️  Testing exam update...');
    await testUpdateExam();
  }
  
  // Step 6: Test delete
  console.log('\n🗑️  Testing exam deletion...');
  await testDeleteExam();
  
  console.log('\n🎉 Tests completed!');
}

// Run the tests
runTests().catch(console.error);