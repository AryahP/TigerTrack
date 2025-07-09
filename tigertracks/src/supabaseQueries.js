import { supabase } from './supabaseClient';


export const performSearchMajors = async (query) => {
  try {
    const { data, error } = await supabase.rpc('search_majors', { query_text: query }); // Pass query as parameter
    if (error) {
      console.error('Error searching:', error);
      throw new Error(`Failed to load options: ${error.message}`);
    }

     if (!data) {
      console.warn('No data returned from major');
      return [];
    }

    console.log('Majors results:', data);
    return data; 

    // Process and display the search results
  } catch (error) {
    console.error('An error occurred during search:', error);
    throw error; 
  }
};

export const performSearchCourses = async (query) => {
  try {
    const { data, error} = await supabase.rpc('search_courses', { query_text: query }); // Pass query as parameter
    if (error) {
      console.error('Error searching:', error);
      throw new Error(`Failed to load options: ${error.message}`);
    }

     if (!data) {
      console.warn('No data returned from courses');
      return [];
    }

     console.log('Courses results:', data);
     return data;
  }
  catch (error) {
    console.error('An error occured due to a problem', error);
    throw error;
  }
};
    

   
export const performSearchCertificates = async (query) => {

const { data, error } = await supabase.rpc('search_certificates', { query_text: query }); // Pass query as parameter
   try { if (error) {
      console.error('Error searching:', error);
      throw new Error(`Failed to load options: ${error.message}`);
    }

     if (!data) {
      console.warn('No data returned from certificates');
      return [];
    }
    
    console.log('Certificates results:', data);
    return data;

  } catch (error) {
    console.error('An error occurred during search:', error);
    throw error;
  }


  };
export const performSearchMinors = async (query) => {
  try {
 const { data, error } = await supabase.rpc('search_minors', { query_text: query }); // Pass query as parameter
    if (error) {
      console.error('Error searching:', error);
      throw new Error(`Failed to load options: ${error.message}`);
    }

    if (!data) {
      console.warn('No data returned from minors');
      return [];
    }

    console.log('Minors results:', data);
    return data;
    
  }
  catch (error) {
    console.error('An error occurred during search:', error);
    throw error; 
  }
  };


// Load all dropdown options using the stored procedure
/**export const loadDropdownOptions = async () => {
  try {
    const { data, error } = await supabase.rpc('get_all_dropdown_options');
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to load options: ${error.message}`);
    }

    if (!data) {
      console.warn('No data returned from get_all_dropdown_options');
      return [];
    }

    console.log(`Loaded ${data.length} dropdown options`);
    return data;
    
  } catch (error) {
    console.error('Error in loadDropdownOptions:', error);
    throw error;
  }
};

**/

// FIXED: Search students using the stored procedure with proper array handling
export const searchStudentsWithRPC = async (tags) => {
  if (!tags || tags.length === 0) {
    return [];
  }

  try {
    // Group tags by type and extract IDs
    const majorIds = tags
      .filter(tag => tag.type === 'major')
      .map(tag => tag.id);
    
    const minorIds = tags
      .filter(tag => tag.type === 'minor')
      .map(tag => tag.id);
    
    const certificateIds = tags
      .filter(tag => tag.type === 'certificate')
      .map(tag => tag.id);
    
    const courseIds = tags
      .filter(tag => tag.type === 'course')
      .map(tag => tag.id);

    console.log('Searching with criteria:', {
      majorIds,
      minorIds, 
      certificateIds,
      courseIds
    });

    // FIXED: Properly handle empty arrays - pass null instead of empty arrays
    const { data, error } = await supabase.rpc('search_students_by_criteria', {
      major_ids: majorIds.length > 0 ? majorIds : null,
      minor_ids: minorIds.length > 0 ? minorIds : null,
      certificate_ids: certificateIds.length > 0 ? certificateIds : null,
      course_ids: courseIds.length > 0 ? courseIds : null
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    if (!data) {
      console.warn('No data returned from search');
      return [];
    }

    console.log(`Found ${data.length} students matching criteria`);
    
    // Process results to ensure arrays are properly handled
    const processedResults = data.map(student => ({
      ...student,
      majors: Array.isArray(student.majors) ? student.majors : [],
      minors: Array.isArray(student.minors) ? student.minors : [],
      certificates: Array.isArray(student.certificates) ? student.certificates : [],
      courses: Array.isArray(student.courses) ? student.courses : []
    }));

    return processedResults;
    
  } catch (error) {
    console.error('Error in searchStudentsWithRPC:', error);
    throw error;
  }
};

// FIXED: Alternative search function using direct SQL queries (fallback option)
/*export const searchStudentsDirectQuery = async (tags) => {
  if (!tags || tags.length === 0) {
    return [];
  }

  try {
    const majorIds = tags.filter(tag => tag.type === 'major').map(tag => tag.id);
    const minorIds = tags.filter(tag => tag.type === 'minor').map(tag => tag.id);
    const certificateIds = tags.filter(tag => tag.type === 'certificate').map(tag => tag.id);
    const courseIds = tags.filter(tag => tag.type === 'course').map(tag => tag.id);

    let query = supabase
      .from('Students')
      .select(`
        student_id,
        first_name,
        last_name,
        graduation_year
      `);

    // Apply filters based on selected criteria
    if (majorIds.length > 0) {
      const { data: studentIdsWithMajors } = await supabase
        .from('StudentMajors')
        .select('student_id')
        .in('major_id', majorIds);
      
      const studentIds = studentIdsWithMajors?.map(row => row.student_id) || [];
      if (studentIds.length === 0) return [];
      query = query.in('student_id', studentIds);
    }

    if (minorIds.length > 0) {
      const { data: studentIdsWithMinors } = await supabase
        .from('StudentMinors')
        .select('student_id')
        .in('minor_id', minorIds);
      
      const studentIds = studentIdsWithMinors?.map(row => row.student_id) || [];
      if (studentIds.length === 0) return [];
      query = query.in('student_id', studentIds);
    }

    if (certificateIds.length > 0) {
      const { data: studentIdsWithCerts } = await supabase
        .from('StudentCertificates')
        .select('student_id')
        .in('certificate_id', certificateIds);
      
      const studentIds = studentIdsWithCerts?.map(row => row.student_id) || [];
      if (studentIds.length === 0) return [];
      query = query.in('student_id', studentIds);
    }

    if (courseIds.length > 0) {
      const { data: studentIdsWithCourses } = await supabase
        .from('StudentCourses')
        .select('student_id')
        .in('class_id', courseIds);
      
      const studentIds = studentIdsWithCourses?.map(row => row.student_id) || [];
      if (studentIds.length === 0) return [];
      query = query.in('student_id', studentIds);
    }

    const { data: students, error } = await query.order('last_name').order('first_name');

    if (error) throw error;

    // Fetch additional details for each student
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        const [majorsData, minorsData, certificatesData, coursesData] = await Promise.all([
          supabase.from('StudentMajors').select('Majors(name)').eq('student_id', student.student_id),
          supabase.from('StudentMinors').select('Minors(name)').eq('student_id', student.student_id),
          supabase.from('StudentCertificates').select('Certificates(name)').eq('student_id', student.student_id),
          supabase.from('StudentCourses').select('Courses(class_code)').eq('student_id', student.student_id)
        ]);

        return {
          ...student,
          majors: majorsData.data?.map(m => m.Majors.name) || [],
          minors: minorsData.data?.map(m => m.Minors.name) || [],
          certificates: certificatesData.data?.map(c => c.Certificates.name) || [],
          courses: coursesData.data?.map(c => c.Courses.class_code) || []
        };
      })
    );

    return enrichedStudents;

  } catch (error) {
    console.error('Error in searchStudentsDirectQuery:', error);
    throw error;
  }
};
*/

// Enhanced test function with better error handling
/*export const testStoredProcedures = async () => {
  try {
    console.log('Testing stored procedures...');
    
    // Test dropdown options
    const options = await loadDropdownOptions();
    console.log('✅ Dropdown options loaded:', options.length);
    
    if (options.length === 0) {
      console.warn('⚠️ No dropdown options found - make sure your database has sample data');
    }
    
    // Test search with empty criteria (should return empty array)
    const emptyResults = await searchStudentsWithRPC([]);
    console.log('✅ Empty search test:', emptyResults.length === 0 ? 'PASS' : 'FAIL');
    
    // Test search with first available option (if any exist)
    if (options.length > 0) {
      const testTags = [options[0]]; // Use first available option
      const searchResults = await searchStudentsWithRPC(testTags);
      console.log('✅ Test search completed:', searchResults.length, 'results');
    }
    
    return {
      success: true,
      optionsCount: options.length,
      testSearchResults: options.length > 0 ? 'completed' : 'skipped (no data)'
    };
    
  } catch (error) {
    console.error('❌ Stored procedure test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
*/
// Helper function to get student details by ID
export const getStudentById = async (studentId) => {
  try {
  const { data, error } = await supabase
    .from('students')
  .select(`
    *,
    studentmajors(
      majors(name, three_letter_code)
    ),
    studentminors(
    minors(name)
    ),
    studentcertificates(
    certificates(name)
    ),
    studentcourses(
    enrollment_year,
    semester,
    courses(class_name, class_code)
  ),
    studenttips(tip_text)
    
  `)
  .eq('student_id', studentId)
  .single();
    if (error) throw error;
    return data;
    
  } catch (error) {
    console.error('Error fetching student details:', error);
    throw error;
  }
};

// Helper function to debug database state
export const debugDatabaseState = async () => {
  try {
    const [studentsResult, majorsResult, coursesResult] = await Promise.all([
      supabase.from('Students').select('*', { count: 'exact' }),
      supabase.from('Majors').select('*', { count: 'exact' }),
      supabase.from('Courses').select('*', { count: 'exact' })
    ]);

    console.log('Database State:');
    console.log('- Students:', studentsResult.count || 0);
    console.log('- Majors:', majorsResult.count || 0);
    console.log('- Courses:', coursesResult.count || 0);

    return {
      students: studentsResult.count || 0,
      majors: majorsResult.count || 0,
      courses: coursesResult.count || 0
    };
  } catch (error) {
    console.error('Error debugging database state:', error);
    return null;
  }
};