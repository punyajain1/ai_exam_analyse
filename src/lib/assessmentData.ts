export interface BoundingBox {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  label: string;
}

export interface QuestionItem {
  id: string;
  number: string;
  subPart?: string;
  text: string;
  maxMarks: number;
  obtainedMarks: number;
  status: "full" | "partial" | "zero";
  aiFeedback: string;
  page: number;
  boundingBox: BoundingBox;
  studentAnswerText?: string;
  conceptCovered?: string;
  groundingUncertain?: boolean;
}

export interface AssessmentData {
  title: string;
  subject: string;
  grade: string;
  questionPaperName: string;
  questionPaperSize: string;
  questionPaperPages: number;
  answerSheetName: string;
  answerSheetSize: string;
  answerSheetPages: number;
  totalPages: number;
  totalMarks: number;
  obtainedMarks: number;
  questions: QuestionItem[];
}

export const sampleAssessment: AssessmentData = {
  title: "Class 10 Biology Unit Test",
  subject: "Biology / Life Processes",
  grade: "Class 10",
  questionPaperName: "Class_10_maths_unit_test.pdf",
  questionPaperSize: "2MB",
  questionPaperPages: 2,
  answerSheetName: "student_1_answer_sheet.pdf",
  answerSheetSize: "8MB",
  answerSheetPages: 4,
  totalPages: 4,
  totalMarks: 45,
  obtainedMarks: 36,
  questions: [
    {
      id: "q1",
      number: "1",
      text: "Which blood vessel carries blood away from the heart?",
      maxMarks: 2,
      obtainedMarks: 2,
      status: "full",
      aiFeedback:
        "Accurate identification! Arteries carry oxygenated blood away from the heart under high pressure.",
      page: 1,
      boundingBox: {
        x: 4.5,
        y: 3.5,
        width: 91,
        height: 5.5,
        label: "Q1",
      },
      studentAnswerText:
        "Arteries are the blood vessels that carry oxygenated blood away from the heart to different parts of the body.",
      conceptCovered: "Circulatory System • Arteries vs Veins",
    },
    {
      id: "q2",
      number: "2",
      text: "Which of the following organelles is primarily involved in photosynthesis?",
      maxMarks: 2,
      obtainedMarks: 2,
      status: "full",
      aiFeedback:
        "Excellent work! You correctly identified the chloroplast as the organelle responsible for photosynthesis. Keep it up!",
      page: 1,
      boundingBox: {
        x: 4.5,
        y: 43.5,
        width: 91,
        height: 14.5,
        label: "Q2",
      },
      studentAnswerText:
        "The process mainly occurs in the chloroplast of the plant cell. It has two main stages: 1. Light reaction - Captures light energy. 2. Dark reaction - Uses energy to make glucose.",
      conceptCovered: "Cell Biology • Chloroplasts",
    },
    {
      id: "q3",
      number: "3",
      text: "Explain the role of chloroplasts in photosynthesis, naming the main pigments involved and briefly outlining the two major stages of the process.",
      maxMarks: 2,
      obtainedMarks: 2,
      status: "full",
      aiFeedback:
        "Great explanation and well-drawn diagram of photosynthesis stages with balanced chemical equation.",
      page: 1,
      boundingBox: {
        x: 4.5,
        y: 10,
        width: 91,
        height: 32,
        label: "Q3",
      },
      studentAnswerText:
        "Photosynthesis is the process used by green plants to convert light energy into chemical energy. 6CO2 + 6H2O -> C6H12O6 + 6O2",
      conceptCovered: "Photosynthesis • Chlorophyll & Reactions",
    },
    {
      id: "q4",
      number: "4",
      text: "Describe the flow of blood through the human heart starting from the right atrium and ending at the aorta; include the names of valves crossed.",
      maxMarks: 2,
      obtainedMarks: 0,
      status: "zero",
      aiFeedback:
        "Incomplete sequence: missed the tricuspid valve and pulmonary semilunar valve in the circulation path.",
      page: 1,
      boundingBox: {
        x: 4.5,
        y: 60,
        width: 91,
        height: 38,
        label: "Q4",
      },
      studentAnswerText:
        "Blood enters the right atrium then goes to the ventricles and pumped out to lungs and then aorta.",
      conceptCovered: "Double Circulation • Heart Valves",
    },
    {
      id: "q5",
      number: "5",
      text: "Draw a labelled diagram of an alveolus showing capillaries and air space (label alveolar sac, capillary, and direction of gas exchange).",
      maxMarks: 2,
      obtainedMarks: 2,
      status: "full",
      aiFeedback:
        "Clean schematic diagram showing alveolar membrane diffusion with bidirectional O2 and CO2 arrows.",
      page: 2,
      boundingBox: {
        x: 4.5,
        y: 3,
        width: 91,
        height: 28,
        label: "Q5",
      },
      studentAnswerText:
        "[Diagram Drawn] Alveolar sac, pulmonary capillary network, O2 in -> CO2 out diffusion gradient.",
      conceptCovered: "Respiration • Gas Exchange",
    },
    {
      id: "q6",
      number: "6",
      text: "Draw a neat labelled diagram of the human digestive system (stomach, small intestine, large intestine, liver, pancreas) and label the site where most absorption occurs.",
      maxMarks: 5,
      obtainedMarks: 4,
      status: "partial",
      aiFeedback:
        "Very good diagram! Small intestine correctly marked as the primary site of nutrient absorption. Deducted 1 mark for missing bile duct connection.",
      page: 2,
      boundingBox: {
        x: 4.5,
        y: 33,
        width: 91,
        height: 64,
        label: "Q6",
      },
      studentAnswerText:
        "[Diagram Drawn] Stomach, Liver, Pancreas, Small Intestine (Site of absorption - Villi), Large Intestine.",
      conceptCovered: "Human Digestion • Absorption",
    },
    {
      id: "q7",
      number: "7",
      text: "Draw and label a nephron (Bowman's capsule, glomerulus, proximal tubule, loop of Henle, distal tubule, collecting duct).",
      maxMarks: 5,
      obtainedMarks: 5,
      status: "full",
      aiFeedback:
        "Exemplary anatomical sketch! All parts of the nephron unit accurately positioned with flow indicators.",
      page: 3,
      boundingBox: {
        x: 4.5,
        y: 3,
        width: 91,
        height: 38,
        label: "Q7",
      },
      studentAnswerText:
        "[Diagram Drawn] Glomerulus inside Bowman's capsule -> PCT -> Loop of Henle -> DCT -> Collecting Duct.",
      conceptCovered: "Excretion • Nephron Structure",
    },
    {
      id: "q8",
      number: "8",
      text: "Explain the structural differences between palisade mesophyll and spongy mesophyll and state how each structure aids its function in the leaf.",
      maxMarks: 5,
      obtainedMarks: 3,
      status: "partial",
      aiFeedback:
        "Palisade layer column density and chloroplast concentration explained well. Could have elaborated on intercellular air spaces facilitating gas exchange in spongy mesophyll.",
      page: 3,
      boundingBox: {
        x: 4.5,
        y: 43,
        width: 91,
        height: 25,
        label: "Q8",
      },
      studentAnswerText:
        "Palisade cells are tightly packed vertically with many chloroplasts for light absorption. Spongy cells are loosely arranged for gas movement.",
      conceptCovered: "Plant Anatomy • Leaf Tissues",
    },
    {
      id: "q9",
      number: "9",
      text: "Describe the process of transpiration in plants in two to three sentences and name two environmental factors that increase its rate.",
      maxMarks: 5,
      obtainedMarks: 5,
      status: "full",
      aiFeedback:
        "Perfect definition of stomatal evaporation creating transpiration pull. Temperature and wind speed correctly identified as rate-increasing factors.",
      page: 3,
      boundingBox: {
        x: 4.5,
        y: 70,
        width: 91,
        height: 27,
        label: "Q9",
      },
      studentAnswerText:
        "Transpiration is the loss of water vapor from aerial parts of the plant through stomata. It creates a suction pull. Factors: High temperature and increased wind speed.",
      conceptCovered: "Transport in Plants • Transpiration",
    },
    {
      id: "q10",
      number: "10",
      text: "Explain how the structure of xylem vessels facilitates water transport in plants (mention one structural feature and its role).",
      maxMarks: 5,
      obtainedMarks: 4,
      status: "partial",
      aiFeedback:
        "Lignified thick walls preventing collapse under negative pressure well explained. Mentioning absence of end walls for continuous capillary flow would make it complete.",
      page: 4,
      boundingBox: {
        x: 4.5,
        y: 3,
        width: 91,
        height: 22,
        label: "Q10",
      },
      studentAnswerText:
        "Xylem vessels have thick lignified cell walls that provide mechanical strength and prevent the vessels from collapsing under strong tension.",
      conceptCovered: "Plant Vascular System • Xylem",
    },
    {
      id: "q11a",
      number: "11",
      subPart: "a.",
      text: "A diagram shows two potted plants — Plant A in bright light with broad green leaves, Plant B kept in dim light with pale, elongated leaves.",
      maxMarks: 2,
      obtainedMarks: 2,
      status: "full",
      aiFeedback:
        "Correct! Identified etiolation response where stem elongates rapidly towards available light in search of photons.",
      page: 4,
      boundingBox: {
        x: 4.5,
        y: 27,
        width: 91,
        height: 20,
        label: "Q11 a.",
      },
      studentAnswerText:
        "Plant B is suffering from etiolation because in dim light, auxins accumulate causing elongation, and chlorophyll synthesis is reduced.",
      conceptCovered: "Plant Hormones • Phototropism",
    },
    {
      id: "q11b",
      number: "11",
      subPart: "b.",
      text: "Suggest one practical measure to help Plant B recover.",
      maxMarks: 3,
      obtainedMarks: 1,
      status: "partial",
      aiFeedback:
        "Moving to sunlight suggested, but gradual acclimatization and trimming weak elongated stems were omitted.",
      page: 4,
      boundingBox: {
        x: 4.5,
        y: 49,
        width: 91,
        height: 15,
        label: "Q11 b.",
      },
      studentAnswerText:
        "Shift Plant B gradually to a sunlit window so it can resume normal chlorophyll production.",
      conceptCovered: "Experimental Biology • Recovery",
    },
    {
      id: "q12",
      number: "12",
      text: "A resting person has tidal volume (air per breath) of 0.5 L and breathes 12 times per minute.",
      maxMarks: 5,
      obtainedMarks: 4,
      status: "partial",
      aiFeedback:
        "Total pulmonary ventilation = 0.5 L × 12 breaths/min = 6.0 L/min calculated correctly with unit.",
      page: 4,
      boundingBox: {
        x: 4.5,
        y: 66,
        width: 91,
        height: 15,
        label: "Q12",
      },
      studentAnswerText:
        "Total pulmonary ventilation = Tidal Volume × Breathing Rate = 0.5 × 12 = 6.0 L / minute.",
      conceptCovered: "Human Physiology • Ventilation",
    },
    {
      id: "q13",
      number: "13",
      text: "If dead space is 0.15 L per breath, calculate the alveolar ventilation per minute. Show working.",
      maxMarks: 5,
      obtainedMarks: 4,
      status: "partial",
      aiFeedback:
        "Alveolar ventilation = (Tidal Volume - Dead Space) × Respiratory Rate = (0.5 - 0.15) × 12 = 4.2 L/min. Formula and arithmetic correct.",
      page: 4,
      boundingBox: {
        x: 4.5,
        y: 83,
        width: 91,
        height: 14,
        label: "Q13",
      },
      studentAnswerText:
        "Alveolar ventilation = (0.5 L - 0.15 L) × 12 = 0.35 × 12 = 4.2 L/min.",
      conceptCovered: "Pulmonary Dynamics • Dead Space",
    },
  ],
};
