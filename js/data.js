/* Rasuli's Knowledge Hub — editable content, separate from rendering code. */
"use strict";
window.HubData = (() => {
  const subjects = [
    {
      name: "Programming",
      image: "programming.jpg",
      alt: "Colorful programming code on a screen",
      steps: [
        "Learn syntax and write a small program.",
        "Practise arrays, functions and problem solving.",
        "Build a project and explain your design choices.",
      ],
    },
    {
      name: "Mathematics",
      image: "mathematics.jpg",
      alt: "Students working through mathematics at a chalkboard",
      steps: [
        "Review functions and algebra.",
        "Work through examples in calculus or linear algebra.",
        "Solve a problem without looking at the solution.",
      ],
    },
    {
      name: "Political Science",
      image: "politics.jpg",
      alt: "Hungarian Parliament beside the Danube in Budapest",
      steps: [
        "Learn how political institutions are organised.",
        "Compare two arguments using primary sources.",
        "Write a short evidence-based comparison.",
      ],
    },
    {
      name: "Economics",
      image: "economics.jpg",
      alt: "Charts and data used for analysis",
      steps: [
        "Understand incentives, markets and trade-offs.",
        "Connect a model to a real-world example.",
        "Explain its assumptions and limitations.",
      ],
    },
    {
      name: "Medicine",
      image: "medicine.jpg",
      alt: "A researcher studying a sample through a microscope",
      steps: [
        "Start with anatomy and scientific terminology.",
        "Read an introductory academic reference.",
        "Summarise the evidence and questions for further study.",
      ],
    },
    {
      name: "Research Skills",
      image: "research.jpg",
      alt: "Students reading and researching in a library",
      steps: [
        "Turn a broad topic into a research question.",
        "Compare sources and record complete citations.",
        "Write a synthesis in your own words.",
      ],
    },
  ];
  const books = [
    [
      "b01",
      "Clean Code",
      "Robert C. Martin",
      "Programming",
      2008,
      "Intermediate",
      30,
      "Practise clear names, small functions and readable software.",
    ],
    [
      "b02",
      "The Pragmatic Programmer",
      "Andrew Hunt & David Thomas",
      "Programming",
      1999,
      "Intermediate",
      25,
      "Explore practical habits for thoughtful software development.",
    ],
    [
      "b03",
      "Calculus: Early Transcendentals",
      "James Stewart",
      "Mathematics",
      1995,
      "Intermediate",
      40,
      "Work systematically through limits, derivatives and integrals.",
    ],
    [
      "b04",
      "Linear Algebra Done Right",
      "Sheldon Axler",
      "Mathematics",
      1997,
      "Advanced",
      40,
      "Develop an understanding of vector spaces and linear maps.",
    ],
    [
      "b05",
      "The Origins of Political Order",
      "Francis Fukuyama",
      "Political Science",
      2011,
      "Intermediate",
      30,
      "Compare the historical development of political institutions.",
    ],
    [
      "b06",
      "The Prince",
      "Niccolò Machiavelli",
      "Political Science",
      1532,
      "Beginner",
      20,
      "Read a historical primary text and question its arguments.",
    ],
    [
      "b07",
      "Thinking, Fast and Slow",
      "Daniel Kahneman",
      "Economics",
      2011,
      "Beginner",
      25,
      "Explore judgement and decision-making through a behavioural lens.",
    ],
    [
      "b08",
      "The Wealth of Nations",
      "Adam Smith",
      "Economics",
      1776,
      "Advanced",
      35,
      "Study a foundational text in the history of economic thought.",
    ],
    [
      "b09",
      "Gray’s Anatomy",
      "Henry Gray",
      "Medicine",
      1858,
      "Advanced",
      40,
      "Use an academic anatomy reference for structured background study.",
    ],
    [
      "b10",
      "Harrison’s Principles of Internal Medicine",
      "Tinsley R. Harrison et al.",
      "Medicine",
      1950,
      "Advanced",
      45,
      "Explore the organisation of a clinical reference for academic learning.",
    ],
  ];
  const resources = books.map(
    ([id, title, author, category, year, level, minutes, description]) => ({
      id,
      title,
      author,
      category,
      year,
      level,
      minutes,
      description,
      type: "Book",
      core: true,
      url:
        "https://books.google.com/books?q=" +
        encodeURIComponent(title + " " + author),
      image: subjects.find((s) => s.name === category).image,
    }),
  );
  resources.push(
    {
      id: "r11",
      title: "MDN Web Docs",
      author: "MDN contributors",
      category: "Programming",
      year: 2026,
      level: "Beginner",
      minutes: 25,
      type: "Reference",
      core: false,
      image: "programming.jpg",
      url: "https://developer.mozilla.org/en-US/docs/Learn_web_development",
      description: "A structured starting point for HTML, CSS and JavaScript.",
    },
    {
      id: "r12",
      title: "MIT OpenCourseWare",
      author: "Massachusetts Institute of Technology",
      category: "Mathematics",
      year: 2026,
      level: "Intermediate",
      minutes: 45,
      type: "Practice",
      core: false,
      image: "mathematics.jpg",
      url: "https://ocw.mit.edu/",
      description:
        "Find open university course material, lectures and problem sets.",
    },
    {
      id: "r13",
      title: "Our World in Data",
      author: "Global Change Data Lab",
      category: "Research Skills",
      year: 2026,
      level: "Beginner",
      minutes: 20,
      type: "Reference",
      core: false,
      image: "research.jpg",
      url: "https://ourworldindata.org/",
      description:
        "Explore research, charts and source data to practise evidence-based reading.",
    },
    {
      id: "r14",
      title: "PubMed",
      author: "National Library of Medicine",
      category: "Medicine",
      year: 2026,
      level: "Advanced",
      minutes: 30,
      type: "Reference",
      core: false,
      image: "medicine.jpg",
      url: "https://pubmed.ncbi.nlm.nih.gov/",
      description:
        "Search biomedical literature and practise evaluating academic sources.",
    },
  );
  const photos = [
    {
      file: "study-together.jpg",
      label: "Students working in a library",
      source:
        "https://www.pexels.com/photo/college-students-with-laptops-inside-the-library-7777691/",
    },
    {
      file: "programming.jpg",
      label: "Programming code",
      source:
        "https://www.pexels.com/photo/display-coding-programming-development-1921326/",
    },
    {
      file: "mathematics.jpg",
      label: "Mathematics classroom",
      source:
        "https://www.pexels.com/photo/anonymous-man-writing-on-chalkboard-near-group-of-diverse-students-at-table-6238020/",
    },
    {
      file: "economics.jpg",
      label: "Data analysis",
      source: "https://www.pexels.com/photo/close-up-of-paper-590022/",
    },
    {
      file: "research.jpg",
      label: "Library research",
      source:
        "https://www.pexels.com/photo/people-studying-in-library-8199762/",
    },
    {
      file: "medicine.jpg",
      label: "Microscope research",
      source:
        "https://www.pexels.com/photo/a-person-looking-at-the-microscope-9574404/",
    },
    {
      file: "politics.jpg",
      label: "Hungarian Parliament",
      source:
        "https://www.pexels.com/photo/parliament-building-in-budapest-21358211/",
    },
    {
      file: "books.jpg",
      label: "Library interior",
      source: "https://images.unsplash.com/photo-1507842217343-583bb7270b66",
    },
  ];
  return { subjects, resources, photos };
})();
