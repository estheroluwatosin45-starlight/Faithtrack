import { Student } from '../types';

const rawNames = `
1.ADEKUNLE ADEDAYO ISAIAH 
2.FASE COVENANT INIOLUWA 
3.OLUSOLA OKIKI EMMANUEL 
4.OKUNADE ILESANMI 
5.KOLAWOLE TOSIN 
6.AJETOMOBI KAYODE DANIEL 
7.OGUNSANYA TEMIDAYO AYODEJI 
8.AKINNIYI VICTOR OLAMIDE 
9.DANIEL IFEOLUWA SAMUEL 
10.ADARAN-KOLA CHARLES 
11.YUSUF BABATUNDE OLUWABUSAYO 
12.BAMIGBOYE SAMUEL AYOBAMI 
13.ALADEGBAMI ADEGOKE 
14.MAKINDE EUGENE OMOGBOLAHAN 
15.OLUWAFEMI ISRAEL 
16.OKESOLA ANTHONY AYOBAMI 
17.APE OLUWASEYI EZEKIEL 
18.AFOLAYAN LAUREL AYOTOMIWA 
19.AYENI IFEDAYO EMMANUEL 
20.AKERELE OLUWADAMILOLA 
21.EKUNDAYO SUCCESS
22.OLORODE BOLUWATIFE OLAYEMI
23.OWONIYI TRIUMPHANT 
24.OLAJIGA DIVINE OLUWAYOMI 
25.OMOLEYE SAMUEL AYOMIDE 
26.MATTHEW OBADIAH 
27.ABU ISAAC AYOMIDE 
28.TEMITOPE DAVID 
29.AKINYEYE MARVELLOUS 
30.OMOPARIOLA PHILIP
31.ADEBOMI CHARLES 
32.OLEBE ADEIFE 
33.AYODELE PRECIOUS 
34.JEGEDE DANIEL 
35.ADEKOLA ADEDOYIN 
36.FASE MICHEAL TERRY 
37.ESAN OLAOLUWA DAVID 
38.OGUNLANA EMMANUEL OLUWADARASIMI 
39.DAVID PRAISE AYOMIDE 
40.MORAKINYO KINGSLEY MAYOWA 
41.ADEOLA BELOVED ADEOLUWA 
42.AWONIYI DAVID OLUWATOBI 
43.ADEYEMI ALAMEEN ADEMOLA 
44.FAKIYESI ABOLAJI DANIEL 
45.ARIYO LIVING FAITH OLULANA 
46.OJO PHILIPS OLAKANMI 
47.ADEGBOYEGA ADENIYI SAMUEL 
48.ADENIYI OLAKUNLE FAITH 
49.OGUNTUYI AYOTOMIWA EMMANUEL 
50.MATTHEW OLUWAPAMILERIN ELIJAH 
51.ADEOJO PROGRESS 
52.TIWO OLUWASEYI 
53.ADEWALE GREATNESS OLAMIDE 
54.OLOKUN OLUWAFEMI RICHARD 
55.AGU DESTINY CHINECHEREM 
56.OGUNJEMILUA ADEKOLA SOLOMON 
57.FATILE HEPZIBAH AYOOLA 
58.OLANREWAJU EMMANUEL 
59.OLANREWAJU CALEB 
60.DADA GOODNEWS 
61.ABOLARINWA YEMI 
62.FOLORUNSHO VICTOR AWOLADE 
63.OLOFINIYI DANIEL 
64.ADEBAYO ITUNU SAMUEL 
65.OGUNYEMI EMMANUEL AYOMIDE 
66.OLUWAFEMI ISREAL IBUKUN 
67.FAMILOSI SAMUEL ADEYINKA 
68.IGE OLUWATIMILEHIN HENRY 
69.ADARALEGBE EMMANUEL OLAMILEKAN 
70.AFOLALU OLUWATIMILEHIN CHRISTOPHER 
71.OLOWOYEYE DAMILOLA DANIEL 
72.EHIZOJIE EMMANUEL JAMES 
73.ALEX-OJO FELIX 
74.ALADESURU ADEGBENRO EZEKIEL 
75.TIMOTHY PELUMI AUSTINE 
76.OLAWUYI SOLOMON OJOOLUWA 
77.OMONIYI JOHN AANUOLUWA 
78.ARISA DAMILARE TIMOTHY 
79.OJUAWO OLAMIDE OLAWALE 
80.AYANNA FERANMI ENULUMKI 
81.AKOMOLAFE TOYINSOLA EMMANUEL 
82.OMOTOSO OLUWATIMILEHIN 
83.AJEKUGBE JAMES OLUTUNBI 
84.BAMIDELE MIRACLE 
85.KAYODE EMMANUEL 
86.OWOEYE GIDEON 
87.TEMITOPE PROSPER 
88.OKWEDI EMMANUEL 
89.ABEJIDE LEKE 
90.ADUMATI FERANMI 
91.OLUWALAYOMI TAIWO 
92.OMOYAJOWO PRAISE 
93.AJAYI EMMANUEL 
94.FAFURE SAMSON 
95.OWOEYE AYODELE 
96.OGUNMODEDE EMMANUEL 
97.ADU MOYINOLUWA 
98.BABALOLA ISAAC 
99.AFUYE OLUWASHOGO 
100.ADESANYA MICHEAL 
101.ALABA ROLAND 
102.ADELUSI STEPHEN 
103.FAJIDE VICTOR AYOMIDE 
104.ALAO-LAWSON MUYIWA 
105.SALIHU ABDULSAMAD 
106.OLADELE OLAYIWOLA AYOMIDE 
107.IDIARE ALEX 
108.ABIODUN FESTUS 
109.AYODELE OLUWAJUWON 
110.OLADAPO WRIGHT 
111.ADEKUAJO FERANMI MICHAEL 
112.FAGBOHUN JONATHAN OLUWATOFARATI 
113.FAGBOHUN JOSEPH OLUWAFERANMI 
114.OKPE BORNY OCHAYI 
115.AKINSOLA PETER OLUWADAMILARE 
116.EKUNDAYO LAUGHTER 
118.OLUWOLE CHRISTOPHER 
119.BABATUNDE OLUWAJOMILOJU PAUL 
120.ADEBAYO STEPHEN ENIOLA 
121.ADARABIOYO JOSHUA 
122.GODWIN OLATINPO DAVID 
123.ADESINA ISREAL AYOMIDE 
124.OMOTOSO ADENIYI OLUWATOBI 
125.JEGEDE IFEOLUWA 
126.OGUNYEMI OLAMIDE 
127.ADEBE FAVOUR OLUWASEUN 
128.OLADUNJOYE NATHANIEL 
129.ADEYIWOLA FAVOUR OLUWADUNSIN 
130.AKINYELE ENIASANMI 
131.AJAYI DOLAPO AYOBAMI 
132.ADEMILUA DAMILOLA
`;

export const initialStudents: Student[] = [
  ...rawNames
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((line, index) => {
      const name = line.replace(/^\d+\./, '').trim();
      return {
        id: `student-initial-${index + 1}`,
        matric_number: `MAT100${(index + 1).toString().padStart(3, '0')}`,
        full_name: name,
        department: 'General',
        faculty: 'Science',
        level: '100L',
        email: `student${index + 1}@example.com`,
        created_at: new Date().toISOString()
      };
    }),
  {
    id: "student-initial-133",
    matric_number: "IMP-300-OGUNJOBI",
    full_name: "OGUNJOBI IYIOLA MICHAEL",
    department: "General",
    faculty: "Nursing",
    level: "300L",
    email: "imp-300-ogunjobi@faithtrack.edu",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-134",
    matric_number: "IMP-300-EMINOWA",
    full_name: "EMINOWA TIMILEHIN",
    department: "General",
    faculty: "Nursing",
    level: "300L",
    email: "imp-300-eminowa@faithtrack.edu",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-135",
    matric_number: "IMP-300-SHOLA",
    full_name: "DADA SHOLA",
    department: "General",
    faculty: "Nursing",
    level: "300L",
    email: "imp-300-shola@faithtrack.edu",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-136",
    matric_number: "IMP-300-OWOLABI",
    full_name: "OWOLABI KEHINDE",
    department: "General",
    faculty: "Nursing",
    level: "300L",
    email: "imp-300-owolabi@faithtrack.edu",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-137",
    matric_number: "IMP-300-EFOGHERE",
    full_name: "EFOGHERE STEPHEN",
    department: "General",
    faculty: "Nursing",
    level: "300L",
    email: "imp-300-efoghere@faithtrack.edu",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-138",
    matric_number: "IMP-200-DAMOLA",
    full_name: "DAMOLA",
    department: "General",
    faculty: "Nursing",
    level: "200L",
    email: "imp-200-damola@faithtrack.edu",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-139",
    matric_number: "202440026058DF",
    full_name: "AKINMOLAFE SHINA JUSTUS",
    department: "General",
    faculty: "Science",
    level: "200L",
    email: "shina@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-140",
    matric_number: "VUI/24/NUR/1088",
    full_name: "IBIJOLA ADEBOBOLA DAVID",
    department: "Nursing",
    faculty: "Nursing",
    level: "200L",
    email: "ibijola@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-141",
    matric_number: "VUI/24/PHT/1003",
    full_name: "ADEOLA AYOMIDE ISREAL",
    department: "Physiotherapy",
    faculty: "Nursing",
    level: "200L",
    email: "adeola.ayomide@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-142",
    matric_number: "VUI/24/PHT/1024",
    full_name: "JOSEPH OZOVEHE SAMUEL",
    department: "Physiotherapy",
    faculty: "Nursing",
    level: "200L",
    email: "joseph.samuel@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-143",
    matric_number: "VUI/24/PHT/1004",
    full_name: "ADEOLA BIDEMI JOSHUA",
    department: "Physiotherapy",
    faculty: "Nursing",
    level: "200L",
    email: "adeola.bidemi@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-144",
    matric_number: "VUI/23/PBH/1001",
    full_name: "BABATUNDE PIPELOLUWA DAVID",
    department: "General",
    faculty: "Science",
    level: "300L",
    email: "babatunde.david@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-145",
    matric_number: "IMP-200-FADAHUNSI",
    full_name: "FADAHUNSI SAMSON",
    department: "General",
    faculty: "Science",
    level: "200L",
    email: "fadahunsi.samson@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-146",
    matric_number: "IMP-100-AFOLABI",
    full_name: "AFOLABI TOYINSOLE",
    department: "General",
    faculty: "Science",
    level: "100L",
    email: "afolabi.toyinsole@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-147",
    matric_number: "IMP-100-STEPHEN",
    full_name: "STEPHEN",
    department: "General",
    faculty: "Science",
    level: "100L",
    email: "stephen@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-148",
    matric_number: "VUI/24/NUR/1053",
    full_name: "AROKODARE OYINDAMOLA PRAISE",
    department: "Nursing",
    faculty: "Nursing",
    level: "200L",
    email: "arokodare@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-149",
    matric_number: "VUI/24/PHT/1019",
    full_name: "AYENI SAMUEL BOLUWATIFE",
    department: "Physiotherapy",
    faculty: "Nursing",
    level: "200L",
    email: "ayeni.samuel@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-150",
    matric_number: "VUI/24/NUR/1008",
    full_name: "ADE-ADEOGUN FAVOUR ABISOLA",
    department: "Nursing",
    faculty: "Nursing",
    level: "200L",
    email: "adeadeogun@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-151",
    matric_number: "VUI/24/NUR/1077",
    full_name: "ENIOLA TAIWO AYOMIDEJI",
    department: "Nursing",
    faculty: "Nursing",
    level: "200L",
    email: "eniola@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-152",
    matric_number: "202441435006CA",
    full_name: "OLAYIWOLA ALIYAT TITILOPE",
    department: "Nursing",
    faculty: "Nursing",
    level: "300L",
    email: "olayiwola@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-153",
    matric_number: "202330728796JA",
    full_name: "ADEJAYAN AYOBAYO TOLUWALASE",
    department: "Nursing",
    faculty: "Nursing",
    level: "300L",
    email: "adejayan@example.com",
    created_at: new Date().toISOString()
  },
  {
    id: "student-initial-154",
    matric_number: "202330411312GA",
    full_name: "OWOLABI EMMANUEL KEHINDE",
    department: "Nursing",
    faculty: "Nursing",
    level: "300L",
    email: "owolabi.emmanuel@example.com",
    created_at: new Date().toISOString()
  }
];
