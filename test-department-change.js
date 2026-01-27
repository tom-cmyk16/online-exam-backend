// Test script for exam department change functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  username: 'examcommittee', // Assuming this user has examCommittee role
  password: 'password123'
};

let authToken = '';

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

async function testGetDepartments() {
  try {
    const response = await fetch(`${BASE_URL}/exams/departments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Departments fetched successfully');
      console.log('   Available departments:', data.departments);
      console.log('   Total count:', data.count);
      return data.departments;
    } else {
      console.log('❌ Failed to fetch departments:', data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Get departments error:', error.message);
    return [];
  }
}

async function testChangeDepartment(examId, newDepartment, reason) {
  try {
    const response = await fetch(`${BASE_URL}/exams/committee/${examId}/change-department`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        newDepartment,
        reason
      }),
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Department change successful');
      console.log('   Changed from:', data.change.from);
      console.log('   Changed to:', data.change.to);
      console.log('   Changed by:', data.change.changedBy);
      console.log('   Reason:', data.change.reason);
      return true;
    } else {
      console.log('❌ Department change failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Change department error:', error.message);
    return false;
  }
}

async function getExamsForTesting() {
  try {
    const response = await fetch(`${BASE_URL}/exams/committee`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    if (response.ok && data.length > 0) {
      console.log('✅ Found exams for testing');
      console.log('   First exam ID:', data[0]._id);
      console.log('   First exam title:', data[0].title);
      console.log('   First exam department:', data[0].department);
      return data[0];
    } else {
      console.log('❌ No exams found for testing');
      return null;
    }
  } catch (error) {
    console.log('❌ Get exams error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting Department Change Tests...\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Get available departments
  console.log('\n🏢 Testing get departments...');
  const departments = await testGetDepartments();
  if (departments.length === 0) {
    console.log('❌ No departments available for testing');
    return;
  }
  
  // Step 3: Get an exam for testing
  console.log('\n📋 Getting exam for testing...');
  const testExam = await getExamsForTesting();
  if (!testExam) {
    console.log('❌ No exam available for testing');
    return;
  }
  
  // Step 4: Test department change
  console.log('\n🔄 Testing department change...');
  const newDepartment = departments.find(dept => dept !== testExam.department);
  if (!newDepartment) {
    console.log('❌ No different department available for testing');
    return;
  }
  
  const changeSuccess = await testChangeDepartment(
    testExam._id,
    newDepartment,
    'Testing department change functionality via API'
  );
  
  if (changeSuccess) {
    console.log('\n🎉 All tests completed successfully!');
  } else {
    console.log('\n❌ Some tests failed');
  }
}

// Run the tests
runTests().catch(console.error);