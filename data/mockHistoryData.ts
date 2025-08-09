import { HistoryEntry, RubricVersion } from '../types/rubric';

// Mock data for overall evaluation criteria version history with branching
export const mockHistoryData: HistoryEntry[] = [
  {
    id: 'v1.0-created',
    timestamp: new Date('2024-01-15T10:30:00'),
    modifier: 'Dr. Sarah Johnson',
    action: 'created',
    field: 'Evaluation Framework',
    newValue: 'Initial child development evaluation framework with 18 criteria',
    comment: 'Created comprehensive evaluation framework for child development AI responses',
    version: 'v1.0',
    changeType: 'add_criteria',
    parentId: undefined, // 真正的根节点，没有前继
    differenceSummary: '+18 Evaluation criteria'
  },
  {
    id: 'v1.1-safety',
    timestamp: new Date('2024-01-20T14:15:00'),
    modifier: 'Prof. Michael Chen',
    action: 'modified',
    field: 'Safety Guidelines',
    oldValue: 'Basic safety protocols',
    newValue: 'Enhanced safety protocols with emergency procedures and risk assessment',
    comment: 'Updated safety guidelines to include comprehensive emergency response procedures',
    version: 'v1.1',
    changeType: 'criteria_description',
    parentId: 'v1.0-created',
    differenceSummary: 'Modified Safety description'
  },
  {
    id: 'v1.2-communication',
    timestamp: new Date('2024-02-01T09:45:00'),
    modifier: 'Dr. Emily Rodriguez',
    action: 'modified',
    field: 'Communication Standards',
    oldValue: 'Standard communication protocols',
    newValue: 'Multilingual communication protocols with cultural sensitivity and accessibility',
    comment: 'Enhanced communication standards to support diverse populations',
    version: 'v1.2',
    changeType: 'criteria_description',
    parentId: 'v1.0-created', // 从根节点分支出来
    differenceSummary: '+1 Communication criteria'
  },
  {
    id: 'v1.3-merge',
    timestamp: new Date('2024-02-10T16:20:00'),
    modifier: 'System',
    action: 'merged',
    field: 'Version Merge',
    oldValue: 'Separate safety and communication branches',
    newValue: 'Merged safety and communication features into main branch',
    comment: 'Merged safety and communication branches into unified framework',
    version: 'v1.3',
    changeType: 'merge_versions',
    parentId: 'v1.1-safety', // 主要前继节点
    differenceSummary: 'Merged Safety + Communication branches'
  }
];

// Mock data for individual criteria history (for comparison)
export const mockIndividualCriteriaHistory: HistoryEntry[] = [
  {
    id: 'criteria-1-created',
    timestamp: new Date('2024-01-15T10:30:00'),
    modifier: 'Dr. Sarah Johnson',
    action: 'created',
    field: 'Theory Application',
    newValue: 'Theoretical Accuracy & Application',
    comment: 'Created new criteria for theoretical application assessment',
    version: 'v1.0',
    differenceSummary: '+1 Theory Application criteria'
  },
  {
    id: 'criteria-1-modified',
    timestamp: new Date('2024-01-20T14:15:00'),
    modifier: 'Prof. Michael Chen',
    action: 'modified',
    field: 'Description',
    oldValue: 'Basic theoretical application',
    newValue: 'Comprehensive theoretical application with practical examples',
    comment: 'Enhanced description to include practical application examples',
    version: 'v1.1',
    differenceSummary: 'Modified Theory Application description'
  },
  {
    id: 'criteria-1-category-change',
    timestamp: new Date('2024-02-01T09:45:00'),
    modifier: 'Dr. Emily Rodriguez',
    action: 'modified',
    field: 'Category',
    oldValue: 'Theory Application',
    newValue: 'Practical Application',
    comment: 'Moved criteria to practical application category for better alignment',
    version: 'v1.2',
    differenceSummary: 'Changed Theory → Practical Application category'
  }
];

// Mock data for current version
export const mockCurrentVersion: RubricVersion = {
  id: '1',
  version: 'v2.4',
  name: 'Child Development Assessment Framework',
  systemPrompt: `Purpose: This GPT model is designed to act as an expert in understanding the needs of children and people supporting those children in relation to specific theories or approaches...`,
  evaluationPrompt: `You are an expert evaluator of AI responses in child development scenarios...`,
  rubricItems: [
    {
      id: '1',
      criteria: 'Theoretical Accuracy & Application',
      description: 'Demonstrates accurate understanding and application of child development theories such as Piaget, Vygotsky, Erikson, and contemporary frameworks like Polyvagal Theory and Neurosequential Model. Evaluates how well the response grounds recommendations in established theoretical foundations.',
      category: 'Theory Application'
    },
    {
      id: '2',
      criteria: 'Safety & Ethics',
      description: 'Ensures child safety and ethical considerations in all recommendations. Evaluates awareness of potential risks, appropriate boundaries, confidentiality, and child-centered approaches that prioritize the child\'s well-being.',
      category: 'Safety & Ethics'
    },
    {
      id: '3',
      criteria: 'Practical Application',
      description: 'Provides concrete, actionable strategies that can be implemented in real-world settings. Evaluates the feasibility, appropriateness, and effectiveness of suggested interventions and activities.',
      category: 'Practical Application'
    },
    {
      id: '4',
      criteria: 'Assessment & Observation',
      description: 'Demonstrates understanding of developmentally appropriate assessment methods and observational techniques. Evaluates ability to gather relevant information and make informed recommendations based on observations.',
      category: 'Assessment & Observation'
    },
    {
      id: '5',
      criteria: 'Communication & Collaboration',
      description: 'Shows effective communication with diverse stakeholders including parents, teachers, and other professionals. Evaluates clarity, cultural sensitivity, and collaborative approach in recommendations.',
      category: 'Communication & Collaboration'
    },
    {
      id: '6',
      criteria: 'Professional Development',
      description: 'Demonstrates commitment to ongoing learning and professional growth. Evaluates awareness of current research, best practices, and reflective practice in child development.',
      category: 'Professional Development'
    },
    {
      id: '7',
      criteria: 'Trauma-Informed Practice',
      description: 'Shows understanding of trauma-informed approaches and their application in child development contexts. Evaluates sensitivity to trauma history and appropriate response strategies.',
      category: 'Safety & Ethics'
    },
    {
      id: '8',
      criteria: 'Cultural Competence',
      description: 'Demonstrates awareness of cultural diversity and its impact on child development. Evaluates ability to provide culturally responsive recommendations and respect for diverse family structures.',
      category: 'Communication & Collaboration'
    },
    {
      id: '9',
      criteria: 'Evidence-Based Practice',
      description: 'Uses research-based approaches and current evidence to inform recommendations. Evaluates integration of scientific literature and best practices in child development.',
      category: 'Theory Application'
    },
    {
      id: '10',
      criteria: 'Individualization',
      description: 'Tailors recommendations to the specific needs, strengths, and context of individual children and families. Evaluates personalization and avoidance of one-size-fits-all approaches.',
      category: 'Assessment & Observation'
    },
    {
      id: '11',
      criteria: 'Family-Centered Approach',
      description: 'Recognizes families as partners in child development and includes them in planning and decision-making. Evaluates respect for family expertise and collaborative problem-solving.',
      category: 'Communication & Collaboration'
    },
    {
      id: '12',
      criteria: 'Prevention & Early Intervention',
      description: 'Identifies opportunities for prevention and early intervention to support optimal development. Evaluates proactive approaches and timely support strategies.',
      category: 'Practical Application'
    }
  ],
  testCases: [
    {
      id: '1',
      input: 'A 4-year-old child is having difficulty transitioning from playtime to cleanup time in preschool.',
      context: 'Response should demonstrate understanding of child development theories and provide practical strategies.'
    },
    {
      id: '2',
      input: 'A parent is concerned about their 2-year-old\'s speech development.',
      context: 'Response should include assessment guidance and family-centered approaches.'
    }
  ],
  useCases: [
    {
      id: 'usecase-1',
      name: 'Generate reflective questions',
      description: 'Create thoughtful questions that help students, teachers, or parents reflect on their learning and development process',
      testCases: [
        {
          id: 'test-1-1',
          input: 'A teacher wants to help students reflect on their learning process',
          context: 'Response should include open-ended questions that encourage self-reflection and metacognition',
          useCaseId: 'usecase-1'
        },
        {
          id: 'test-1-2',
          input: 'A counselor needs questions to help clients process their emotions',
          context: 'Response should provide therapeutic questions that promote emotional awareness and processing',
          useCaseId: 'usecase-1'
        }
      ]
    },
    {
      id: 'usecase-2',
      name: 'Provide developmental guidance',
      description: 'Offer age-appropriate guidance and recommendations for child development milestones',
      testCases: [
        {
          id: 'test-2-1',
          input: 'A parent asks about their 3-year-old\'s social development',
          context: 'Response should include typical social milestones and strategies for supporting social growth',
          useCaseId: 'usecase-2'
        },
        {
          id: 'test-2-2',
          input: 'A teacher needs strategies for supporting a child with learning differences',
          context: 'Response should provide inclusive teaching strategies and accommodation suggestions',
          useCaseId: 'usecase-2'
        }
      ]
    },
    {
      id: 'usecase-3',
      name: 'Address behavioral challenges',
      description: 'Help understand and respond to challenging behaviors in developmentally appropriate ways',
      testCases: [
        {
          id: 'test-3-1',
          input: 'A child is having tantrums during transitions',
          context: 'Response should provide strategies for smooth transitions and emotional regulation',
          useCaseId: 'usecase-3'
        },
        {
          id: 'test-3-2',
          input: 'A student is struggling with attention in class',
          context: 'Response should offer classroom management strategies and attention-building activities',
          useCaseId: 'usecase-3'
        }
      ]
    },
    {
      id: 'usecase-4',
      name: 'Support learning activities',
      description: 'Design and recommend educational activities that promote learning and development',
      testCases: [
        {
          id: 'test-4-1',
          input: 'A parent wants to create learning activities for their 4-year-old',
          context: 'Response should suggest age-appropriate educational activities that are engaging and developmentally suitable',
          useCaseId: 'usecase-4'
        },
        {
          id: 'test-4-2',
          input: 'A teacher needs ideas for hands-on science activities for preschoolers',
          context: 'Response should provide safe, engaging science experiments that teach basic concepts',
          useCaseId: 'usecase-4'
        }
      ]
    },
    {
      id: 'usecase-5',
      name: 'Providing reflective questions for teacher meetings',
      description: 'For use case: Providing reflective questions (and explanations for why those questions may be helpful) that the worker could use to facilitate discussion in a future teacher meeting …. including questions that help reflect on the teacher\'s strengths and concerning behaviors. The goal here is to help the S123 worker work with the teacher to help the teacher reflect on their strengths and any concerning behaviors, so that they could collaboratively work together to understand how the teacher could best bring out their strengths.',
      testCases: [
        {
          id: 'test-5-1',
          input: 'Use Context: A student frequently interrupts or talks over peers during group activities.\n\nScenario: During a group discussion, Marcus keeps blurting out answers without raising his hand. Instead of addressing the behavior directly, the teacher turns to the class and says with a smirk, "Well, I guess Marcus is running the lesson today." A few students laugh uncomfortably while Marcus grins, not realizing he\'s being mocked. The tone sets an unclear boundary and leaves the rest of the group unsure how to engage.',
          context: 'Response should provide reflective questions that help the teacher examine their response to student interruptions, including questions about the impact of sarcasm on classroom dynamics, alternative approaches to managing interruptions, and how to maintain authority while being respectful.',
          useCaseId: 'usecase-5'
        },
        {
          id: 'test-5-2',
          input: 'Use Context: A child becomes withdrawn or shuts down when given constructive feedback.\n\nScenario: When Lily turns in her math worksheet with multiple errors, the teacher glances at it and immediately starts erasing answers without saying a word. Lily watches silently as the teacher redoes her work, offering no explanation or encouragement. "There," the teacher mutters, placing it back on Lily\'s desk. Lily folds her arms and doesn\'t touch her pencil for the rest of the lesson, feeling invisible.',
          context: 'Response should provide reflective questions that help the teacher examine their feedback delivery methods, including questions about the emotional impact of silent corrections, how to provide constructive feedback that builds confidence, and strategies for maintaining student engagement during corrections.',
          useCaseId: 'usecase-5'
        },
        {
          id: 'test-5-3',
          input: 'Use Context: Two students repeatedly argue or escalate minor disagreements into conflicts.\n\nScenario: Jayden and Amira start arguing during a group activity, but the teacher only steps in to scold Amira. "Jayden\'s been doing all the work — maybe you should listen for once," she snaps, ignoring Amira\'s side of the story. Amira goes quiet, clearly upset, while Jayden smirks and continues without her. The favoritism reinforces tension between the two and increases the likelihood of future conflicts.',
          context: 'Response should provide reflective questions that help the teacher examine their conflict resolution approach, including questions about the impact of taking sides, how to remain neutral while addressing conflicts, and strategies for fostering collaborative problem-solving between students.',
          useCaseId: 'usecase-5'
        },
        {
          id: 'test-5-4',
          input: 'Use Context: A student displays difficulty transitioning between activities, often becoming agitated or disruptive.\n\nScenario: As the class moves from lunch to quiet reading time, Daniel refuses to sit at his desk, pacing instead. The teacher pretends not to notice, saying in a strained voice, "We\'ll all just wait for Daniel to be ready, I guess." The whole class turns to stare at him, and Daniel\'s face flushes red. Rather than helping him ease into the transition, the public spotlight makes him more anxious and defiant.',
          context: 'Response should provide reflective questions that help the teacher examine their transition management strategies, including questions about the impact of public pressure on students with transition difficulties, alternative approaches to supporting smooth transitions, and how to maintain classroom flow while supporting individual needs.',
          useCaseId: 'usecase-5'
        },
        {
          id: 'test-5-5',
          input: 'Use Context: A child shows signs of anxiety or stress during academic challenges, such as refusing to participate.\n\nScenario: When Sofia expresses frustration about a timed reading quiz, saying, "I\'m going to mess this up," the teacher, clearly overwhelmed, responds with a flat tone: "Just do your best," without looking up. Sofia hesitates, then puts her head down on the desk. The teacher continues grading papers without following up. The lack of emotional presence deepens Sofia\'s anxiety and sense of isolation.',
          context: 'Response should provide reflective questions that help the teacher examine their response to student anxiety, including questions about the importance of emotional presence during challenging moments, how to validate student feelings while encouraging participation, and strategies for supporting anxious students without enabling avoidance.',
          useCaseId: 'usecase-5'
        },
        {
          id: 'test-5-6',
          input: 'Use Context: Conflict in a small group\n\nScenario: Two students at a shared table begin speaking over each other while working on a math activity. One student raises their voice, while the other crosses their arms and looks away. The teacher walks past, glances at the group, and briefly nods at one of the students without saying anything.',
          context: 'Response should provide reflective questions that help the teacher examine their strengths in noticing student dynamics, including questions about what they observed in the interaction, how their brief acknowledgment might have supported the students, and ways to build on this strength to provide more comprehensive support.',
          useCaseId: 'usecase-5'
        },
        {
          id: 'test-5-7',
          input: 'Use Context: A student needing reassurance before reading aloud\n\nScenario: A student hesitates when it\'s their turn to read aloud and looks toward the teacher. The teacher remains seated at the back of the room and raises a thumb in the student\'s direction. The student looks back at their book and begins reading.',
          context: 'Response should provide reflective questions that help the teacher examine their strength in providing non-verbal support, including questions about how their gesture conveyed confidence to the student, what made this approach effective, and ways to expand this strength to support other students in similar situations.',
          useCaseId: 'usecase-5'
        },
        {
          id: 'test-5-8',
          input: 'Use Context: A child upset over losing a game at recess\n\nScenario: After recess, a student enters the classroom with furrowed brows and their arms crossed. As the class settles in, the teacher says aloud, "It\'s okay to feel upset sometimes," while looking toward the group. No further comment is made, and the lesson continues.',
          context: 'Response should provide reflective questions that help the teacher examine their strength in normalizing emotions, including questions about how their acknowledgment might have helped the student feel seen, what made this approach appropriate for the situation, and ways to build on this strength to support emotional regulation.',
          useCaseId: 'usecase-5'
        },
        {
          id: 'test-5-9',
          input: 'Use Context: A student distracted and doodling during instruction\n\nScenario: While the teacher reads a story aloud to the class, one student looks down at their desk and draws in the corner of a notebook. After finishing the page, the teacher says, "I notice some creative drawing—are you thinking about what\'s happening in the story?" and looks at the student with a neutral expression.',
          context: 'Response should provide reflective questions that help the teacher examine their strength in reframing behavior positively, including questions about how their approach might have engaged the student differently than a reprimand, what made this response effective, and ways to apply this strength to other situations where students appear disengaged.',
          useCaseId: 'usecase-5'
        }
      ]
    },
    {
      id: 'usecase-6',
      name: 'Providing reflective questions for teacher meetings',
      description: 'Create reflective questions that help workers facilitate discussion in future teacher meetings, addressing disconnects between framing and understanding',
      testCases: [
        {
          id: 'test-6-4',
          input: 'I wanted reflective questions because I was feeling a disconnect between the way that I was framing our conversations and the teachers\' understanding (of my words and of the child). I don\'t want to include observations that don\'t directly involve M, but I\'d like some reflective questions to explore. I want them to tie in with M and his history and experiences while also addressing the classroom environment and social and emotional supports.',
          context: `Reflective Questions: Exploring the Environment & Emotional Supports
\nCo-Regulation & Trauma Sensitivity:

How can we continue using co-regulating adult presence to help Messiah sustain attention and manage transitions, especially during less structured times like centers?

Given Messiah's history of trauma and the potential for hypervigilance, how can we create a classroom rhythm that balances stimulation and calm moments, helping him feel safe without needing to be "on alert"?

\nSocial Problem-Solving & Peer Dynamics:

How can we strengthen peer problem-solving skills in ways that reduce "policing" behaviors and instead foster empathy and collaboration?

What language or modeling can help peers support Messiah in moments of dysregulation without triggering feelings of shame or exclusion?

\nEmotional Expression & Repair:

When Messiah expresses frustration (e.g., "Lunch is boring!"), how can we validate his emotions while guiding him toward alternative ways of expressing them?

How can we use everyday moments to model emotional repair (e.g., "It looks like you didn't mean to splash me. What could we do to fix it?") instead of relying on scripted apologies?

\nClassroom Regulation Spaces:

Does Messiah view spaces like the sensory table or cozy corner as tools for regulation?

How might we adjust the use of these spaces to ensure they are always framed as supportive, not punitive, especially for children with trauma histories who may be sensitive to perceived exclusion?

\n Supporting Autonomy & Boundaries:

In moments of dysregulation, how can we offer Messiah choices that give him a sense of control while still maintaining classroom boundaries?

Are there opportunities to shift from directive language ("Don't do that") to reflective or choice-based prompts ("I see you want to splash—what's another way we can play with the water?")?`,
          useCaseId: 'usecase-6'
        },
        {
          id: 'test-6-5',
          input: 'Please ground my report in the lenses of the polyvagal theory and neuroequential model to better understand the child\'s worldview: Ever since K, a four-year-old child, moved from his previous classroom, Ms. S. has provided a more structured environment that seems to offer him a greater sense of safety. K can have emotional tantrums that may last up to 30 minutes. Although Ms. S. has nine other students to attend to, she still gives him individual attention and offers her soothing presence. Her classroom, considered a programming room, has a more structured daily routine, which appears to support K\'s emotional regulation. Ms. S. is a very insightful and caring teacher. K has speech delays that often prevent him from expressing his needs and emotions effectively. He is in clear need of speech therapy. His family is experiencing financial difficulties, and his parents are divorced, which results in him moving between two homes. Despite these challenges, K responds well to encouragement. Ms. S. is intuitive and nurturing, offering him opportunities to build autonomy. K struggles with problem-solving and is developmentally behind compared to his peers. He thrives in routine; however, any disruption in that routine can be very dysregulating for him. His mother shared that she is in the process of signing him up for speech therapy. She also mentioned that he enjoys being outdoors and that she is working on encouraging more independence at home. During my observation, K appeared interactive. He smiled more and followed the lead of his peers, although he rarely initiated activities on his own. He enjoys being the helper in the classroom. Ms. S. frequently encourages him to communicate his needs by prompting him to "use your words." He experiences frequent meltdowns and often seeks connection and co-regulation in those moments. K enjoys coloring and tends to stay within the lines. He shows a strong interest in letters and numbers and loves dancing and singing. He is currently learning potty training but struggles to communicate when he needs to use the restroom and often does not indicate when he is wet. Ms. S. offers gentle encouragement and uses natural consequences such as having him sit beside her for five minutes to reflect on the situation. K frequently repeats instructions word for word if he does not fully understand them, and he often echoes sentences after Ms. S. The teacher consistently redirects his behavior in a calm and collected manner. She presents herself as a confident and gentle leader. K enjoys playing at various centers and has strong fine motor skills. He collaborates well with other children and is also capable of entertaining himself in solo play, often appearing to live in his own imaginative world. Ms. S. uses humor intentionally and encourages him to express his feelings. The current goals set for K are to develop self-regulation skills and to improve his ability to communicate his needs and feelings. The ultimate goal is to gradually shorten the duration of his tantrums.',
          context: `Certainly. Here's your report revised and expanded through the **lenses of the Polyvagal Theory (PVT)** and the **Neurosequential Model of Therapeutics (NMT)** to help better understand and contextualize K's behavior, needs, and relational patterns:

---

**Grounded Report on K through the Lenses of Polyvagal Theory and the Neurosequential Model**

Since K, a four-year-old child, transitioned from his previous classroom, Ms. S. has offered a more predictable and structured environment that appears to meet his core need for safety and regulation. From a **Polyvagal Theory (Porges, 2011)** perspective, this structure likely supports activation of K's **ventral vagal state**—the part of the autonomic nervous system responsible for social engagement, safety, and connection. Predictability and nurturing relationships act as cues of safety, allowing K's nervous system to shift from a survival-based state (e.g., fight/flight or shutdown) into one that enables relational engagement and learning.

Despite challenges, K demonstrates relational openness and responsiveness when Ms. S. provides consistent, attuned, and calm co-regulation. Although he experiences **emotional dysregulation in the form of tantrums lasting up to 30 minutes**, the soothing presence of Ms. S.—even while balancing attention to nine other students—helps anchor K's overwhelmed nervous system. In **Neurosequential Model (Perry & Hambrick, 2008)** terms, these episodes may reflect disorganization at the **brainstem and diencephalon levels**, where regulatory functions like arousal and sensory integration are still maturing due to stress, trauma, or developmental delays.

K's **speech delays** further limit his ability to name internal emotional states or advocate for his needs, likely intensifying feelings of frustration or helplessness. Language development plays a critical role in **prefrontal cortex maturation**, supporting executive functioning, problem-solving, and self-regulation. His tendency to echo instructions word-for-word may be a **regulatory strategy**—an attempt to cognitively anchor himself in a predictable script when he's unsure or overwhelmed.

His home life presents additional complexity: financial hardship, divided caregiving due to divorce, and transitions between two homes. These factors can create chronic unpredictability and reduce access to consistent **relational buffering**, a cornerstone of healthy neurodevelopment. Ms. S.'s **intuitive and relationally safe presence** may be serving as a vital source of **neural scaffolding**, helping him build the regulatory and social capacities that his environment may not consistently offer.

K's reliance on **routines** underscores how important predictability is for his **neurobiological sense of safety**. From both PVT and NMT views, routines act as external regulators—anchoring his nervous system and supporting his ability to remain in a **tolerable window of arousal**. When those routines rupture, he loses access to his developing prefrontal skills and regresses to more primitive survival responses.

During classroom observation, K appeared more interactive—smiling, following peers, and engaging with the environment in a more regulated state. While still hesitant to initiate, his willingness to follow the lead of others suggests that **social imitation** is a gateway into broader engagement. He finds comfort in helping roles and responds to Ms. S.'s prompts like "use your words," which provide **bottom-up support** for skill development rather than punitive correction.

He demonstrates notable **strengths**: a love for coloring within the lines (fine motor and focus), fascination with letters and numbers (cognitive interest), and enthusiasm for dancing and singing (sensory-motor integration). These are "**islands of competence**" that provide opportunities for attuned connection and regulate his nervous system through **rhythmic, patterned activities**, a central concept in the NMT framework.

K is also learning potty training but struggles to interoceptively recognize or communicate when he needs to use the restroom. Ms. S.'s use of **natural consequences** paired with warm, non-shaming guidance supports the development of both **self-awareness** and **behavioral regulation**.

His echolalia (repeating sentences) and close imitation of instructions are adaptive attempts to process and integrate new information. Ms. S.'s calm redirections and her confident, regulated presence model a **secure adult nervous system**, which K can co-regulate with, even if unconsciously. Her use of **humor, warmth, and structured encouragement** enhances his capacity to stay within a window of engagement.

K enjoys center-based play and is capable of solo imaginative play, suggesting emerging **cortical strengths** and the potential for deeper narrative development. While he sometimes appears "in his own world," he maintains the ability to **rejoin group rhythms** when given gentle scaffolding.

---

**Framing His Current Goals Through a Neurobiological Lens:**

1. **Enhancing Self-Regulation:** Continue structured, rhythmic activities (e.g., music, coloring, helping routines) that support brainstem-to-cortex integration and build K's regulatory toolkit.
2. **Supporting Communication Development:** Engage in play-based, relational speech support; consider integrating visuals and rhythmic prompts that support both expressive and receptive language systems.
3. **Reducing Tantrum Duration:** Leverage co-regulation through consistent relational cues, reduce sensory overload, and gradually build tolerance to small changes in routine.

---

**Conclusion**

Understanding K through the Polyvagal Theory and the Neurosequential Model reveals a child whose behaviors are not signs of defiance, but rather reflections of a nervous system shaped by stress, underdevelopment in key regulatory domains, and a yearning for safety and connection. Ms. S. is offering not only a classroom, but a **neurobiologically attuned relational space**—a sanctuary where K can begin to heal, grow, and build the foundational skills for future learning and well-being.

---

Let me know if you'd like this restructured for a parent conference or simplified for broader audiences.`,
          useCaseId: 'usecase-6'
        },
        {
          id: 'test-6-6',
          input: 'Please simplify the language of the report into practical and classroom appropriate language',
          context: `Absolutely. Here's a simplified, classroom-appropriate version of the report that retains the insights from the **Polyvagal Theory** and **Neurosequential Model**, but uses clear and practical language for teachers, aides, or school staff:

---

**Simplified Report on K — Understanding Through a Brain-Based Lens**

Since K moved into Ms. S.'s classroom, he seems to feel safer and more at ease. The daily routines and clear structure help him know what to expect, which is very important for his sense of safety and ability to learn. When the classroom feels calm and predictable, it helps K stay in a "ready to learn" state. This idea comes from something called the **Polyvagal Theory**, which teaches us that kids need to feel safe and connected before they can focus, play, or learn.

K has big feelings that can lead to long tantrums—sometimes up to 30 minutes. Even though Ms. S. has nine other students, she gives K the time and calm presence he needs when he's upset. This is what we call **co-regulation**—when an adult stays calm and helps a child calm down by being a steady, comforting presence. This is especially helpful when a child's brain and body are stuck in a "fight or flight" or overwhelmed state.

K has speech delays, which makes it hard for him to say how he feels or what he needs. This can be frustrating for him and sometimes leads to meltdowns. He's not doing this on purpose—his brain is still learning how to express and handle big emotions. His home life is a bit unpredictable too. He moves between two homes, and his family is dealing with financial stress. These types of stress can affect how a child's brain develops, especially when it comes to emotional regulation and problem-solving. That's part of what the **Neurosequential Model** helps us understand: the brain develops from the bottom up, and some kids need extra support building those early blocks of safety and regulation before they can move on to higher-level thinking.

K does really well when things go as expected, but any change in routine can be very upsetting. He thrives when he knows what's coming next. His mom shared that he enjoys being outside and she's working on helping him become more independent at home.

When I observed him in class, K looked more engaged and happy than before. He smiled and followed along with what his peers were doing, even if he didn't always take the lead himself. He loves to help out in the classroom and seems to feel proud when he gets to play that role. Ms. S. often reminds him gently to "use your words" to express his needs. Even though he struggles with this, it's helping him learn. During meltdowns, he seeks connection—he wants someone to be there with him.

K loves coloring (and he stays inside the lines!), enjoys letters and numbers, and lights up during music and movement activities like dancing and singing. These kinds of rhythmic, sensory activities are great for his brain and body—they help him stay regulated and engaged.

He's still learning to use the potty, but doesn't always tell someone when he needs to go or when he's had an accident. Ms. S. handles this with kindness, using natural consequences like having him sit next to her to think about what happened. This gives him structure without shame.

K often repeats back what's said to him, especially if he doesn't fully understand. This repetition is actually one of the ways he's trying to make sense of what's happening. Ms. S. is very consistent in how she responds to his behavior. She stays calm, clear, and warm—which is exactly what he needs. Her use of humor and encouragement helps him feel connected and safe.

K does well in play centers, has strong fine motor skills, and is able to entertain himself in solo play. Sometimes it seems like he's in his own little world, but he can rejoin the group when gently invited. That's a good sign that he's developing trust and connection.

---

**What We're Working On:**

1. **Helping K Calm Down Faster:** Support him with routines, calming activities (like music, movement, or helping roles), and stay near during dysregulation.
2. **Building Language Skills:** Use simple language, visual supports, and repetition. Encourage him to label his feelings and ask for help.
3. **Fostering Independence:** Give him chances to make choices and take on responsibilities (like helping jobs or picking activities).
4. **Staying Consistent:** Predictability helps K feel safe. Clear transitions and routines help reduce meltdowns.

---

**Final Thoughts**

K is not trying to be difficult—his brain is still learning how to manage big feelings and communicate effectively. With consistent structure, warmth, and patience, he is making progress. Ms. S. is doing a wonderful job creating a classroom environment that supports his nervous system and emotional needs. Over time, with continued support and speech therapy, we expect to see more independence, shorter tantrums, and stronger communication from K.

---

Let me know if you'd like this turned into a one-page handout or visuals to share with staff!`,
          useCaseId: 'usecase-6'
        }
      ]
    }
  ],
  createdAt: new Date('2024-01-15T10:00:00Z'),
  history: mockHistoryData
};

// Mock data for additional versions
export const mockVersions: RubricVersion[] = [
  mockCurrentVersion,
  {
    ...mockCurrentVersion,
    id: '2',
    version: 'v2.0',
    name: 'Enhanced Safety Framework',
    rubricItems: [
      ...mockCurrentVersion.rubricItems,
      {
        id: '3',
        criteria: 'Emergency Response Protocols',
        description: 'Demonstrates knowledge of emergency procedures and crisis management',
        category: 'Safety & Ethics'
      }
    ],
    createdAt: new Date('2024-02-01T10:00:00Z')
  },
  {
    ...mockCurrentVersion,
    id: '3',
    version: 'v2.1',
    name: 'Communication Enhancement',
    rubricItems: [
      ...mockCurrentVersion.rubricItems,
      {
        id: '4',
        criteria: 'Cultural Sensitivity',
        description: 'Shows awareness of cultural differences and inclusive communication',
        category: 'Communication & Collaboration'
      }
    ],
    createdAt: new Date('2024-02-15T14:30:00Z')
  }
]; 