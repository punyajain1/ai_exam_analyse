/**
 * Centralized prompts for Gemini AI calls
 */

export const EXTRACT_QUESTIONS_PROMPT = `You are extracting questions from a printed exam question paper.

Rules:
1. Process pages strictly in the order given, top-to-bottom within each page.
2. Extract EVERY question, in the exact order they appear.
3. If a question has labelled sub-parts (e.g. "11 (a)", "11 (b)", "Q5.i", "Q5.ii"),
   treat EACH sub-part as a separate entry. Do not merge sub-parts into one entry.
4. Preserve the original printed numbering/label exactly as written in \`rawLabel\`
   (keep punctuation and spacing as printed, e.g. "11 (b)" not "11b").
5. Derive \`number\` and \`subpart\` from rawLabel (subpart omitted if none exists).
6. In \`text\`, extract the concise question statement and any multiple choice options (A, B, C, D) clearly.
7. Extract marks only if explicitly printed (e.g. "[5 marks]"); omit the field otherwise.
8. Record the page index (0-based) each question appears on.
9. Classify \`expectedAnswerType\`:
   - "diagram" if the question asks the student to draw, sketch, or label a figure and nothing else.
   - "mixed" if it asks for both a written explanation AND a diagram/labelling.
   - "text" otherwise.
10. Output strictly as JSON matching the provided schema. No prose, no markdown fences.`;

export const GENERATE_RUBRICS_PROMPT = `You are creating a grading rubric for each exam question, to be used later to grade
many different students fairly and consistently against the SAME checklist.

For each question:
1. Break the ideal answer down into discrete, checkable criteria, each worth some
   portion of the total marks (criteria marks must sum to the question's total marks;
   default total to 2 if not specified).
2. If \`expectedAnswerType\` is "diagram" or "mixed", criteria must be structure-aware:
   list the specific structures, parts, and labels a correct diagram must include, and
   any relationships/arrows/directions that must be correctly shown (e.g. "Bowman's
   capsule labelled", "arrow shows direction of filtration"). Do not require any
   particular drawing style, only correct structure and correctly placed labels.
3. Grade based on whether each concept/structure is demonstrated, NOT on the length,
   verbosity, or format of the answer. A correct, minimal answer must be able to score
   the same as a correct, elaborate one. Do not reward padding or repetition.
4. Set \`acceptableForms\` to a short note on what formats should count as valid evidence
   for this question (e.g. "prose, bullet points, or a labelled diagram are equally
   valid" or "diagram with labels required; prose alone is insufficient" if the question
   specifically demands a diagram).
5. Output strictly as JSON matching the schema. No prose outside the JSON.`;

export const EXTRACT_ANSWERS_PROMPT = `You are extracting a student's handwritten answers from a scanned answer sheet page.

You are given the exact list of questions from the question paper (e.g. "1", "2", "3", ... "14").
The student may answer questions in any order, may skip questions, or may write multi-step solutions / calculations.

You MUST perform this task in two explicit stages:

### STAGE A — INVENTORY (Complete visual scan of this page):
1. Scan the ENTIRE page from top to bottom.
2. Produce a list of EVERY distinct visual handwritten block, diagram, calculation, or paragraph on the page in reading order.
3. For each block, record:
   - \`blockIndex\`: sequential integer index (0, 1, 2, ...)
   - \`visibleLabel\`: any label written near the block (e.g., "Q1", "Ans 7", "7.", "13", "(b)"), or null if unlabeled.
   - \`rawText\`: complete transcription of the handwritten text, equations, formulas, and labels.
   - \`box_2d\`: exact bounding box [ymin, xmin, ymax, xmax] normalized to 0-1000 scale around the ink.

### STAGE B — ASSIGNMENT (Mapping blocks to actual questions):
Map the inventory blocks to questions from the question paper using these strict rules:

1. **DO NOT FORCE-MAP UNANSWERED QUESTIONS**:
   - If a question was skipped or not answered by the student on this page, DO NOT create a fake or guessed answer for it.
   - DO NOT map unrelated scratch calculations or section headers (e.g. "Section-B", "Ch-5 Test") to unanswered questions.
   - Only include an item in \`answers\` if it is a genuine student response to a specific question.

2. **FULL-SOLUTION BOUNDING (Unite all steps & equations)**:
   - When a student's answer consists of multiple steps, equations, or paragraphs (e.g. formula -> working -> final answer), you MUST include ALL corresponding \`assignedFromBlockIndices\`.
   - The answer's \`box_2d\` MUST tightly encompass the ENTIRE solution on this page from the top question label down to the final boxed/underlined answer.
   - Set \`transcribedText\` to include the full text and working from all steps.

3. **DISAMBIGUATE LABELS USING QUESTION PAPER CONTEXT**:
   - Cross-reference messy handwritten labels against the provided Question Paper list.
   - Example: If a student's messy handwriting looks like "89." or "19." but is positioned between Q10 and Q12 and solves Question 11's arithmetic progression, assign \`detectedLabel: "11"\` (or "Q11").
   - Do NOT emit question numbers that do not exist in the Question Paper (e.g., "89" when questions are only 1-14).

4. **MULTI-PAGE / CONTINUED SOLUTIONS**:
   - If a solution is started on one page and continued or restarted on another page (e.g. Q13 on Page 6 and Page 7), emit an answer entry for each page with the same \`detectedLabel\` (e.g. "Q13").

5. Set \`confidence\`: "high" if explicit clear label exists, "medium" if inferred from sequence/content, "low" if uncertain.

Output strictly as JSON matching the schema with \`inventory\` and \`answers\`. No markdown fences, no prose outside JSON.`;

export const GRADE_ANSWERS_PROMPT = `You are grading a student's exam answers. For each question you are given: the question
text, a rubric (a list of specific criteria with marks), the student's transcribed answer
text, and an image of the actual answer region as written by the student.

Grading rules:
1. Evaluate against the rubric criteria specifically — mark each criterion as met or not
   met based on evidence in the IMAGE first, using the transcribed text as a supplementary
   aid only (transcription of diagrams is often incomplete or unreliable).
2. For questions whose rubric expects a diagram or structure, evaluate the actual drawing:
   check for correct structure, presence and correctness of labels, and correct
   relationships/arrows. A diagram-only answer with all required labels correct must be
   able to score full marks, even with no accompanying prose.
3. Do not reward length, verbosity, or repetition. Do not penalize brevity. A short,
   correct answer scores the same as a long, correct one covering the same criteria.
4. Sum the marks for all criteria marked "met" to produce \`score\`, capped at \`maxMarks\`.
5. Set \`verdict\`: "correct" if score is at or near maxMarks, "incorrect" if score is 0 or
   near 0, "partial" otherwise.
6. Give brief, specific \`feedback\` (1-2 sentences) referencing which criteria were met or
   missed — not a generic comment.
7. Multi-attempt / Multi-page solutions: If work for the question appears in multiple places
   (e.g., initial scratch-work/attempt on one page and a final completed solution on another page,
   or a solution spanning multiple pages), evaluate the COMPLETE body of work across all places.
   Always give precedence to the student's best and final completed solution, awarding full marks
   for correct steps and final answers shown in any part of their solution.

Also produce one 2-3 sentence \`overallFeedback\` summarizing performance across all questions.

Output strictly as JSON matching the schema. No prose outside the JSON.`;
