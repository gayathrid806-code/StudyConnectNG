/**
 * StudyConnect — Curriculum index (Course → Branch → Semester → Subjects)
 */
const SubjectsIndex = {
  curriculum: {
    'Diploma': {
      'CSE': {
        'Semester 1': ['Mathematics I', 'basic Physics',' general engineering chemistry', 'computer fundamental and hardware',] ,
        'Semester 2': ['Web technologies','programming in C','Applied physics','applied engineering chemistry', 'Mathematics II'],
        'Semester 3': ['computer organization and architecture','applied engineering mathematics',' digital electroics','OOPS through C++','data structures through C','Computer Networks'],
        'Semester 4': ['advanced engineering mathematics', 'pyothn programming', 'RDBMS','Cryptography and network security', 'operating systems','Java Programming'],
        'Semester 5': ['software engineering', 'Mobile App Development', 'artifical intaligence','internet of things','entrepreneurship and strtups','.net programming through c#','software engineering', 'Project Work'],
        'Semester 6': ['Industrial Training', 'Advanced Java', 'Capstone Project']
      },
      'ECE': {
        'Semester 1': ['Basic Electronics', 'Mathematics I',' basic physics', 'general engineering chemistry','semiconductor devices','Engineering Drawing'],
        'Semester 2': ['engineering mathematics','applied physics' ,'applied engineering chemisrty','programming in C', 'electroinic devices and circuits'],
        'Semester 3': ['applied engineering mathematics', 'Communication Systems','electronic measuring instrunents' ,'liner integrated circuits &applications' ,'networl analysis','digital electroics'],
        'Semester 4': ['advance engineeering mathematics ', 'microprocessors and microcontrollers', 'semiconductor technology','microwave comminicatoin', 'datacommunication and computer networks', 'python programming'],
        'Semester 5': ['Wireless Communication', 'Optical Communication', 'Project Work'],
        'Semester 6': ['Industrial Training', 'Satellite Communication', 'Capstone Project']
      },
      'EEE': {
        'Semester 1': ['Engineering Mathematics I', 'Electrical Engineering Material', 'General Engineering Chemistry', 'Engineering Physics', 'Basic Electrical Engineering'],
        'Semester 2': ['electronic devices', 'programming C',  'applied engineering chemistry', 'applied physics','Engineering Mathematics II'],
        'Semester 3': ['electrical and electronic measuring instruments',  'DC machine and batteries', 'didital electroincs', 'applied engineering mathematics','electric power system generation', 'electrical circuits'],
        'Semester 4': ['electrical estimation and installation', ' AC machines','electrical power system',' microprocessors and microcontrollers','basic mechanical engineering'],
        'Semester 5': ['switchgear and protection','electric vechicles' ,'industrial motor controls','advanced protection of power system', 'ac motors'],
        'Semester 6': ['Industrial Training', 'High Voltage Engineering', 'Capstone Project']
      },
      'Mechanical': {
        'Semester 1': ['Engineering Mathematics I', 'Engineering Physics','engineering mechanics','workshop technology','general engineering chemistry'],
        'Semester 2': ['manufacturing technology','programming in c', 'applied engineering chemistry','applied physics', 'Engineering Mathematics II'],
        'Semester 3': ['fluid mechanics and hydraulic machinery', 'thermodynamics','strength of materials', 'engineering materials', 'additive and advanced manufacturing processes'],
        'Semester 4': ['industrial engineering,estimation and costing','thermal engineering','design of machine elements', 'green energy', 'Basic EEE'],
        'Semester 5': ['fluid power system','automobile engineering','AI' , 'refrigerations and air conditioning', 'IME and start ups'],
        'Semester 6': ['Industrial Training', 'Power Plant Engineering', 'Capstone Project']
      },
      'Civil': {
        'Semester 1': ['Engineering Mathematics I', 'buildind materials', 'Engineering Physics','basic surveying ','general engineering chemistry'],
        'Semester 2': ['Engineering Mechanics','applied chemisrty', 'programming in C ','physics', 'Engineering Mathematics II'],
        'Semester 3': ['applied engineering mathematics','transportation engineeering','construction practice ','Building drawing','hydraulic','levelling surveying', 'strength of materials'],
        'Semester 4': ['advanced engineering mathematics','advanced surveying', 'reinforced concrete','basic quantity','water supply &sanitary engineering', 'irrigation engineering'],
        'Semester 5': ['Environmental Engineering','construction management and entrepreneurship','theory of structures', 'soil mechanics'],
        'Semester 6': ['Industrial Training', 'Construction Management', 'Capstone Project']
      },
      'IT': {
        'Semester 1': ['Mathematics I', 'Programming Fundamentals', 'Digital Logic'],
        'Semester 2': ['Data Structures', 'Computer Organization', 'Mathematics II'],
        'Semester 3': ['DBMS', 'Operating Systems', 'Web Programming'],
        'Semester 4': ['Software Engineering', 'Computer Networks', 'Java Programming'],
        'Semester 5': ['Cloud Computing', 'Information Security', 'Project Work'],
        'Semester 6': ['Industrial Training', 'Data Analytics', 'Capstone Project']
      }
    },
    'B.Tech': {
      'CSE': {
        'Semester 1': ['Calculus', 'Physics', 'Programming Fundamentals'],
        'Semester 2': ['Linear Algebra', 'Data Structures', 'Digital Logic Design'],
        'Semester 3': ['Data Structures & Algorithms', 'Discrete Mathematics', 'OOP with Java'],
        'Semester 4': ['Operating Systems', 'DBMS', 'Computer Networks'],
        'Semester 5': ['Computer Networks', 'Software Engineering', 'Machine Learning'],
        'Semester 6': ['Compiler Design', 'Web Technologies', 'Elective I'],
        'Semester 7': ['Cloud Computing', 'Elective II', 'Mini Project'],
        'Semester 8': ['Major Project', 'Professional Ethics', 'Elective III']
      },
      'ECE': {
        'Semester 1': ['Calculus', 'Physics', 'Basic Electronics'],
        'Semester 2': ['Signals & Systems', 'Digital Electronics', 'Network Analysis'],
        'Semester 3': ['Analog Circuits', 'Electromagnetic Theory', 'Probability & Statistics'],
        'Semester 4': ['Communication Systems', 'Microprocessors', 'Control Systems'],
        'Semester 5': ['Digital Signal Processing', 'VLSI Design', 'Antenna Theory'],
        'Semester 6': ['Wireless Communication', 'Embedded Systems', 'Elective I'],
        'Semester 7': ['Optical Communication', 'Elective II', 'Mini Project'],
        'Semester 8': ['Major Project', 'Satellite Communication', 'Elective III']
      },
      'EEE': {
        'Semester 1': ['Calculus', 'Physics', 'Basic Electrical Engineering'],
        'Semester 2': ['Circuit Theory', 'Engineering Drawing', 'Engineering Chemistry'],
        'Semester 3': ['Electrical Machines I', 'Power Systems I', 'Measurements'],
        'Semester 4': ['Electrical Machines II', 'Power Electronics', 'Control Systems'],
        'Semester 5': ['Power Systems II', 'Electrical Drives', 'Renewable Energy'],
        'Semester 6': ['High Voltage Engineering', 'Switchgear & Protection', 'Elective I'],
        'Semester 7': ['Smart Grid', 'Elective II', 'Mini Project'],
        'Semester 8': ['Major Project', 'Industrial Management', 'Elective III']
      },
      'Mechanical': {
        'Semester 1': ['Calculus', 'Physics', 'Engineering Drawing'],
        'Semester 2': ['Engineering Mechanics', 'Workshop Practice', 'Engineering Chemistry'],
        'Semester 3': ['Thermodynamics', 'Strength of Materials', 'Manufacturing Processes'],
        'Semester 4': ['Fluid Mechanics', 'Machine Design', 'Heat Transfer'],
        'Semester 5': ['Automobile Engineering', 'Refrigeration & AC', 'Dynamics of Machinery'],
        'Semester 6': ['Finite Element Analysis', 'Robotics', 'Elective I'],
        'Semester 7': ['Power Plant Engineering', 'Elective II', 'Mini Project'],
        'Semester 8': ['Major Project', 'Industrial Management', 'Elective III']
      },
      'Civil': {
        'Semester 1': ['Calculus', 'Physics', 'Engineering Drawing'],
        'Semester 2': ['Engineering Mechanics', 'Surveying', 'Engineering Chemistry'],
        'Semester 3': ['Strength of Materials', 'Building Materials', 'Fluid Mechanics'],
        'Semester 4': ['Structural Analysis', 'Concrete Technology', 'Geotechnical Engineering'],
        'Semester 5': ['Transportation Engineering', 'Environmental Engineering', 'Hydraulics'],
        'Semester 6': ['Design of Structures', 'Construction Management', 'Elective I'],
        'Semester 7': ['Earthquake Engineering', 'Elective II', 'Mini Project'],
        'Semester 8': ['Major Project', 'Professional Ethics', 'Elective III']
      },
      'IT': {
        'Semester 1': ['Calculus', 'Physics', 'Programming Fundamentals'],
        'Semester 2': ['Data Structures', 'Digital Logic', 'Discrete Mathematics'],
        'Semester 3': ['DBMS', 'Operating Systems', 'Web Technologies'],
        'Semester 4': ['Software Engineering', 'Computer Networks', 'Java Programming'],
        'Semester 5': ['Cloud Computing', 'Information Security', 'Data Analytics'],
        'Semester 6': ['Mobile App Development', 'DevOps', 'Elective I'],
        'Semester 7': ['Blockchain', 'Elective II', 'Mini Project'],
        'Semester 8': ['Major Project', 'Professional Ethics', 'Elective III']
      },
      'AI & ML': {
        'Semester 1': ['Calculus', 'Physics', 'Programming Fundamentals'],
        'Semester 2': ['Linear Algebra', 'Probability & Statistics', 'Python Programming'],
        'Semester 3': ['Linear Algebra', 'Python Programming', 'Statistics'],
        'Semester 4': ['Machine Learning', 'Data Structures', 'Deep Learning Basics'],
        'Semester 5': ['Deep Learning', 'NLP', 'Computer Vision'],
        'Semester 6': ['Reinforcement Learning', 'Big Data', 'Elective I'],
        'Semester 7': ['AI Ethics', 'Elective II', 'Mini Project'],
        'Semester 8': ['Major Project', 'Generative AI', 'Elective III']
      },
      'Data Science': {
        'Semester 1': ['Calculus', 'Physics', 'Programming Fundamentals'],
        'Semester 2': ['Linear Algebra', 'Probability & Statistics', 'Python for DS'],
        'Semester 3': ['Statistics', 'Python for DS', 'Data Visualization'],
        'Semester 4': ['Machine Learning', 'SQL for Analytics', 'Data Mining'],
        'Semester 5': ['Big Data Analytics', 'ML Algorithms', 'Data Mining'],
        'Semester 6': ['Business Analytics', 'Time Series Analysis', 'Elective I'],
        'Semester 7': ['Deep Learning', 'Elective II', 'Mini Project'],
        'Semester 8': ['Major Project', 'Data Engineering', 'Elective III']
      }
    }
  },

  /** Get subjects for a course, branch, and semester */
  getSubjects(course, branch, semester) {
    return this.curriculum[course]?.[branch]?.[semester] || [];
  },

  /** Get all courses */
  getCourses() {
    return Object.keys(this.curriculum);
  },

  /** Get branches for a course */
  getBranches(course) {
    return Object.keys(this.curriculum[course] || {});
  },

  /** Get semesters for a course and branch */
  getSemesters(course, branch) {
    return Object.keys(this.curriculum[course]?.[branch] || {});
  },

  /** Flat list of all unique subjects across the curriculum */
  getAllSubjects() {
    const subjects = new Set();
    for (const course of this.getCourses()) {
      for (const branch of this.getBranches(course)) {
        for (const semester of this.getSemesters(course, branch)) {
          this.getSubjects(course, branch, semester).forEach(s => subjects.add(s));
        }
      }
    }
    return [...subjects].sort();
  }
};
