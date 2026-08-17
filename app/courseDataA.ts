import type { Lesson } from "./courseTypes";

export const foundationA1A2Lessons: Lesson[] = [
  {
    id: "fnd-01",
    level: "Foundation",
    unit: "Foundation · How French works",
    title: "The French sentence and subject pronouns",
    summary: "Build a basic statement and identify who performs the action.",
    objective:
      "Build a neutral French statement and choose the subject pronoun that controls the verb.",
    rule:
      "A neutral statement normally follows subject + conjugated verb + complements. French finite verbs normally require an expressed subject: je, tu, il, elle, on, nous, vous, ils, or elles. On takes a third-person singular verb and often means we in everyday French.",
    pattern: "subject + conjugated verb + complement(s)",
    examples: [
      { fr: "Je prépare le dîner.", en: "I am preparing dinner." },
      { fr: "On travaille demain.", en: "We are working tomorrow." },
    ],
    trap:
      "Do not write on travaillons: on always takes the same verb form as il or elle.",
    exercise: {
      prompt: "Complete: Emma et Lucas ___ à Paris.",
      options: ["habite", "habitent", "habitez"],
      answer: "habitent",
      rationale:
        "Emma et Lucas is a third-person plural subject, equivalent to ils.",
    },
    prerequisites: [],
    tags: ["sentence structure", "subject pronouns", "agreement", "on"],
    sourceKeys: ["cei", "fei", "tv5"],
    sourceNote:
      "Foundation sequencing follows CEFR-oriented beginner descriptors; pronoun use and beginner examples are cross-checked against institutional French-learning guidance.",
  },
  {
    id: "fnd-02",
    level: "Foundation",
    unit: "Foundation · How French works",
    title: "Gender, number, and agreement",
    summary: "Make determiners and adjectives match the noun they describe.",
    objective:
      "Identify a noun's gender and number, then make its determiner and adjective agree.",
    rule:
      "Every French noun has grammatical gender. Determiners and most adjectives agree with the noun in gender and number. Plurals commonly add -s, but several noun and adjective families have other forms.",
    pattern: "determiner + noun + agreeing adjective",
    examples: [
      {
        fr: "un petit appartement / des petits appartements",
        en: "a small apartment / small apartments",
      },
      { fr: "La porte est ouverte.", en: "The door is open." },
    ],
    trap:
      "A noun ending may suggest its gender, but it does not prove it; learn a new noun with its article.",
    exercise: {
      prompt: "Complete: Ce sont deux actrices ___.",
      options: ["français", "française", "françaises"],
      answer: "françaises",
      rationale:
        "Actrices is feminine plural, so français becomes françaises.",
    },
    prerequisites: ["fnd-01"],
    tags: ["gender", "number", "agreement", "adjectives"],
    sourceKeys: ["academie", "oqlf", "fei"],
    sourceNote:
      "Agreement rules are based on standard reference grammar; the lesson limits itself to the productive beginner pattern and explicitly reserves irregular families for later study.",
  },
  {
    id: "fnd-03",
    level: "Foundation",
    unit: "Foundation · How French works",
    title: "Infinitives and conjugated verbs",
    summary:
      "Distinguish a dictionary form from a verb carrying person and tense.",
    objective:
      "Recognize an infinitive and use a finite verb form that agrees with its subject.",
    rule:
      "A simple infinitive such as parler, finir, or vendre is the dictionary form and does not mark person. In an ordinary finite clause, the conjugated verb marks tense and agrees with its subject. After many conjugated verbs, a second verb remains in the infinitive.",
    pattern: "subject + finite verb (+ infinitive)",
    examples: [
      { fr: "Tu parles français.", en: "You speak French." },
      { fr: "Nous aimons voyager.", en: "We like traveling." },
    ],
    trap:
      "Do not use a bare infinitive as the finite verb of a neutral statement: *je parler is incorrect; use je parle.",
    exercise: {
      prompt: "Complete: Vous ___ ce restaurant.",
      options: ["choisir", "choisit", "choisissez"],
      answer: "choisissez",
      rationale: "The finite verb must take the vous form: choisissez.",
    },
    prerequisites: ["fnd-01"],
    tags: ["verbs", "infinitive", "conjugation", "finite verb"],
    sourceKeys: ["fei", "tv5", "academie"],
    sourceNote:
      "The finite-versus-infinitive distinction and terminology follow standard French grammar, presented here in an A1-ready form.",
  },
  {
    id: "a1-01",
    level: "A1",
    unit: "A1 · Nouns and descriptions",
    title: "Definite and indefinite articles",
    summary:
      "Show whether a noun is specific, newly introduced, or discussed generally.",
    objective:
      "Choose a definite or indefinite article according to reference and meaning.",
    rule:
      "Use un, une, or des to introduce one or more countable referents that are not yet identifiable from context; the referent may be specific or nonspecific. Use le, la, l’, or les for something identifiable from context and commonly for a whole category, especially after verbs of preference.",
    pattern:
      "un/une/des + newly introduced or contextually unidentified referent; le/la/l’/les + identifiable or general referent",
    examples: [
      { fr: "J’achète une baguette.", en: "I am buying a baguette." },
      { fr: "J’aime le chocolat.", en: "I like chocolate." },
    ],
    trap:
      "French normally uses a definite article for general likes and dislikes: j’aime la musique, not j’aime musique.",
    exercise: {
      prompt:
        "Complete to express a general preference: Elle adore ___ musique classique.",
      options: ["une", "la", "de la"],
      answer: "la",
      rationale:
        "Musique classique is being discussed as a general category after adorer.",
    },
    prerequisites: ["fnd-02"],
    tags: ["articles", "definite", "indefinite", "general reference"],
    sourceKeys: ["oqlf", "academie", "tv5"],
    sourceNote:
      "Article choice is grounded in standard usage references; the examples distinguish newly introduced or contextually unidentified count nouns from generic reference.",
  },
  {
    id: "a1-02",
    level: "A1",
    unit: "A1 · Present-tense communication",
    title: "Être and avoir",
    summary:
      "Use the two most important irregular verbs for identity, description, possession, and common expressions.",
    objective:
      "Use present-tense être and avoir in basic descriptions and high-frequency expressions.",
    rule:
      "Être means to be; avoir normally means to have. French also uses avoir in expressions for age, hunger, thirst, heat, cold, fear, and need.",
    pattern: "subject + être/avoir + complement",
    examples: [
      { fr: "Elle est fatiguée.", en: "She is tired." },
      { fr: "J’ai vingt ans.", en: "I am twenty years old." },
    ],
    trap:
      "Age is expressed with avoir: j’ai vingt ans, not je suis vingt ans.",
    exercise: {
      prompt: "Complete: Nous ___ faim.",
      options: ["sommes", "avons", "faisons"],
      answer: "avons",
      rationale: "Avoir faim is the fixed expression meaning to be hungry.",
    },
    prerequisites: ["fnd-03"],
    tags: ["être", "avoir", "present tense", "age", "expressions"],
    sourceKeys: ["fei", "tv5", "academie"],
    sourceNote:
      "Forms and idiomatic uses reflect standard French; selected expressions match high-frequency A1 communicative needs.",
  },
  {
    id: "a1-03",
    level: "A1",
    unit: "A1 · Present-tense communication",
    title: "Core present-tense verb patterns",
    summary:
      "Conjugate regular -er and finir-type -ir verbs, plus the common vendre-type -re pattern.",
    objective:
      "Produce the present-tense endings of regular -er and finir-type -ir verbs and of the common vendre-type -re model.",
    rule:
      "Regular -er endings are -e, -es, -e, -ons, -ez, -ent; finir-type -ir endings are -is, -is, -it, -issons, -issez, -issent; vendre-type -re endings are -s, -s, zero, -ons, -ez, -ent.",
    pattern:
      "-er: e/es/e/ons/ez/ent · finir-type -ir: is/is/it/issons/issez/issent · vendre-type -re: s/s/—/ons/ez/ent",
    examples: [
      { fr: "Ils regardent un film.", en: "They are watching a movie." },
      { fr: "Vous finissez à cinq heures.", en: "You finish at five o’clock." },
    ],
    trap:
      "Not every verb ending in -ir follows finir; partir, dormir, and venir belong to other families. French -re verbs also vary, so apply this model only to vendre-type verbs.",
    exercise: {
      prompt: "Complete: Tu ___ ta vieille voiture.",
      options: ["vend", "vends", "vendez"],
      answer: "vends",
      rationale:
        "The tu form of the vendre-type -re verb vendre ends in -s.",
    },
    prerequisites: ["fnd-03"],
    tags: ["present tense", "regular verbs", "-er", "-ir", "-re"],
    sourceKeys: ["academie", "fei", "tv5"],
    sourceNote:
      "Conjugation paradigms follow standard French references; the -ir and -re labels are deliberately restricted to the finir and vendre types.",
  },
  {
    id: "a1-04",
    level: "A1",
    unit: "A1 · Present-tense communication",
    title: "Essential irregular present-tense verbs",
    summary:
      "Control the high-frequency verbs needed for everyday communication.",
    objective:
      "Recognize and use the present forms of core irregular verbs in context.",
    rule:
      "Aller, faire, venir, prendre, pouvoir, vouloir, and devoir have frequent but irregular forms. Learn each present-tense pattern as a complete family rather than constructing it from a regular ending.",
    pattern:
      "learn the full paradigm: je, tu, il/elle/on, nous, vous, ils/elles",
    examples: [
      { fr: "Je vais au travail à pied.", en: "I walk to work." },
      { fr: "Ils font du sport le samedi.", en: "They exercise on Saturdays." },
    ],
    trap:
      "Do not regularize aller: say je vais, tu vas, and il va, not *j’alle or *je va.",
    exercise: {
      prompt: "Complete: Nous ___ le bus à huit heures.",
      options: ["prendons", "prenons", "prennent"],
      answer: "prenons",
      rationale: "The nous form of prendre is prenons.",
    },
    prerequisites: ["a1-02", "a1-03"],
    tags: ["present tense", "irregular verbs", "aller", "faire", "prendre"],
    sourceKeys: ["academie", "fei", "tv5"],
    sourceNote:
      "Verb selection is frequency- and function-driven for A1; all forms follow standard conjugation references.",
  },
  {
    id: "a1-05",
    level: "A1",
    unit: "A1 · Nouns and descriptions",
    title: "Adjective agreement and position",
    summary:
      "Describe nouns with the correct form and natural word order.",
    objective:
      "Make a descriptive adjective agree and place common adjectives naturally.",
    rule:
      "Most descriptive adjectives follow the noun and agree with it. Some very common adjectives of beauty, age, goodness, and size usually precede the noun. Position can sometimes affect meaning and is learned with each adjective.",
    pattern: "noun + most adjectives; selected common adjective + noun",
    examples: [
      {
        fr: "Elle habite dans une maison blanche.",
        en: "She lives in a white house.",
      },
      { fr: "Nous avons un petit jardin.", en: "We have a small garden." },
    ],
    trap:
      "Agreement follows the noun being described, not the gender of the speaker.",
    exercise: {
      prompt: "Complete: Elle porte des chaussures ___.",
      options: ["noir", "noire", "noires"],
      answer: "noires",
      rationale:
        "Chaussures is feminine plural, so noire becomes noires.",
    },
    prerequisites: ["fnd-02", "a1-01"],
    tags: ["adjectives", "agreement", "word order", "description"],
    sourceKeys: ["oqlf", "academie", "fei"],
    sourceNote:
      "The lesson reflects standard adjective agreement and default placement while warning that placement is lexical and can affect meaning.",
  },
  {
    id: "a1-06",
    level: "A1",
    unit: "A1 · Nouns and descriptions",
    title: "C’est, il est, and il y a",
    summary: "Identify, describe, and state that something exists.",
    objective:
      "Distinguish identification with c’est, description with il/elle est, and existence with il y a.",
    rule:
      "Use c’est commonly before a noun phrase with a determiner or a stressed pronoun, and for a general or impersonal evaluation with an adjective, as in c’est intéressant. Use il/elle est + adjective when the pronoun refers to an already identified person or thing, and normally before an unmodified profession. Use il y a to say there is or there are.",
    pattern:
      "c’est + noun phrase with determiner/general adjective · il/elle est + adjective with antecedent/profession · il y a + noun",
    examples: [
      { fr: "C’est Paul ; il est médecin.", en: "That is Paul; he is a doctor." },
      {
        fr: "Il y a un café près de la gare.",
        en: "There is a café near the train station.",
      },
    ],
    trap:
      "For a simple profession, say il est médecin; with a noun phrase introduced by a determiner, say c’est un médecin.",
    exercise: {
      prompt:
        "Complete to state that a pharmacy exists nearby: ___ une pharmacie près d’ici.",
      options: ["C’est", "Il est", "Il y a"],
      answer: "Il y a",
      rationale:
        "The sentence states that a pharmacy exists in that location.",
    },
    prerequisites: ["a1-02", "a1-05"],
    tags: ["c’est", "il est", "il y a", "identification", "existence"],
    sourceKeys: ["oqlf", "tv5", "fei"],
    sourceNote:
      "The contrast follows standard presentational usage; profession is qualified with normally because determiner choice changes with modification and discourse meaning.",
  },
  {
    id: "a1-07",
    level: "A1",
    unit: "A1 · Nouns and descriptions",
    title: "Possessive and demonstrative determiners",
    summary: "Indicate ownership and point out particular nouns.",
    objective:
      "Select a possessive or demonstrative determiner that matches its noun.",
    rule:
      "Mon, ma, mes; ton, ta, tes; and son, sa, ses agree with the possessed noun, not the owner. Ce, cet, cette, and ces mean this, that, these, or those. Cet precedes a masculine singular vowel sound.",
    pattern: "possessive/demonstrative determiner + agreeing noun phrase",
    examples: [
      { fr: "Marie cherche son téléphone.", en: "Marie is looking for her phone." },
      { fr: "Cet hôtel est très calme.", en: "This hotel is very quiet." },
    ],
    trap:
      "Before a feminine singular vowel sound, use mon, ton, or son for pronunciation: mon amie, not ma amie.",
    exercise: {
      prompt: "Complete: Sophie aime ___ école.",
      options: ["sa", "son", "ses"],
      answer: "son",
      rationale:
        "École is feminine singular, but its vowel sound requires son.",
    },
    prerequisites: ["fnd-02", "a1-01"],
    tags: ["possessives", "demonstratives", "determiners", "agreement"],
    sourceKeys: ["oqlf", "academie", "tv5"],
    sourceNote:
      "Determiner paradigms and the vowel-sound alternation follow standard usage references.",
  },
  {
    id: "a1-08",
    level: "A1",
    unit: "A1 · Questions and negatives",
    title: "Forming questions",
    summary:
      "Ask yes/no and information questions in neutral, conversational, and formal styles.",
    objective:
      "Form a grammatical question using intonation, est-ce que, or inversion.",
    rule:
      "A yes/no question can use rising intonation, est-ce que, or formal inversion. Place a question word such as où, quand, comment, or pourquoi in the position required by the chosen pattern.",
    pattern: "est-ce que + subject + verb · question word + inversion",
    examples: [
      {
        fr: "Est-ce que vous travaillez demain ?",
        en: "Are you working tomorrow?",
      },
      {
        fr: "Pourquoi apprend-il le français ?",
        en: "Why is he learning French?",
      },
    ],
    trap:
      "Do not combine est-ce que with subject–verb inversion: est-ce que parlez-vous is nonstandard.",
    exercise: {
      prompt: "Which neutral question means Where does she live?",
      options: [
        "Où est-ce qu’elle habite ?",
        "Où est-ce qu’habite-t-elle ?",
        "Est-ce où elle habite ?",
      ],
      answer: "Où est-ce qu’elle habite ?",
      rationale:
        "Est-ce que is followed by ordinary subject–verb order.",
    },
    prerequisites: ["a1-03", "a1-04"],
    tags: ["questions", "est-ce que", "inversion", "question words", "register"],
    sourceKeys: ["oqlf", "academie", "tv5"],
    sourceNote:
      "Question patterns and register labels are cross-checked against normative and pedagogical references.",
  },
  {
    id: "a1-09",
    level: "A1",
    unit: "A1 · Questions and negatives",
    title: "Basic negation",
    summary: "Make a finite clause negative with ne…pas.",
    objective:
      "Place ne or n’ and pas correctly around a conjugated verb.",
    rule:
      "In standard written French, place ne or n’ before the conjugated verb and pas after it. Subject and object pronouns remain before the verb.",
    pattern: "subject + ne/n’ + conjugated verb + pas",
    examples: [
      { fr: "Je ne comprends pas.", en: "I do not understand." },
      { fr: "Elle n’est pas ici.", en: "She is not here." },
    ],
    trap:
      "Ne is often omitted in informal speech, but retain it in neutral and formal writing.",
    exercise: {
      prompt: "Complete: Nous ___ travaillons ___ le dimanche.",
      options: ["ne / pas", "pas / ne", "n’ / pas"],
      answer: "ne / pas",
      rationale:
        "Travaillons begins with a consonant, so ne precedes the verb and pas follows it.",
    },
    prerequisites: ["a1-02", "a1-03"],
    tags: ["negation", "ne pas", "word order", "register"],
    sourceKeys: ["oqlf", "academie", "tv5"],
    sourceNote:
      "The lesson teaches the standard written form while accurately noting common spoken omission of ne.",
  },
  {
    id: "a1-10",
    level: "A1",
    unit: "A1 · Place and quantity",
    title: "À, de, contractions, and geographical names",
    summary:
      "Express location, destination, and origin with the correct contraction.",
    objective:
      "Choose à, de, en, au, aux, du, or des for common places and country names.",
    rule:
      "À + le becomes au and à + les becomes aux; de + le becomes du and de + les becomes des. Use à/de with most cities, en/de with most feminine countries, au/du with most masculine countries, and aux/des with plural countries.",
    pattern: "à + le = au · à + les = aux · de + le = du · de + les = des",
    examples: [
      {
        fr: "Elle habite en France mais travaille au Canada.",
        en: "She lives in France but works in Canada.",
      },
      {
        fr: "Nous revenons des États-Unis.",
        en: "We are coming back from the United States.",
      },
    ],
    trap:
      "Never write à le or de les where the mandatory contractions au or des are required.",
    exercise: {
      prompt: "Complete: Ils vont ___ Japon.",
      options: ["à", "en", "au"],
      answer: "au",
      rationale:
        "Japon is a masculine singular country name, so destination uses au.",
    },
    prerequisites: ["a1-01"],
    tags: ["prepositions", "contractions", "countries", "cities", "location"],
    sourceKeys: ["oqlf", "academie", "tv5"],
    sourceNote:
      "The productive location and origin patterns are standard; most is retained because geographical names include lexical exceptions.",
  },
  {
    id: "a1-11",
    level: "A1",
    unit: "A1 · Place and quantity",
    title: "Partitive articles and quantities",
    summary:
      "Refer to an unspecified amount of food, drink, or another uncountable substance.",
    objective:
      "Use a partitive article, de after common quantity expressions, and de after ordinary negation.",
    rule:
      "Use du, de la, de l’, or des for an unspecified amount. After many common quantity expressions, including beaucoup, peu, and units of measure, use de or d’. In most negative quantity statements, the article also becomes de or d’; être is an important exception.",
    pattern:
      "du/de la/de l’/des + noun · common quantity expression + de + noun",
    examples: [
      { fr: "Je bois du café.", en: "I drink coffee." },
      { fr: "Nous n’achetons pas de pain.", en: "We are not buying any bread." },
    ],
    trap:
      "Many common quantities take de: beaucoup de riz and un kilo de pommes, not beaucoup du riz in the ordinary nonspecific meaning.",
    exercise: {
      prompt:
        "Complete the ordinary nonspecific quantity phrase: Elle veut un kilo ___ pommes.",
      options: ["des", "de", "du"],
      answer: "de",
      rationale:
        "The measure phrase un kilo is followed by de before the noun.",
    },
    prerequisites: ["a1-01", "a1-09"],
    tags: ["partitive", "quantity", "articles", "negation", "de"],
    sourceKeys: ["oqlf", "academie", "tv5"],
    sourceNote:
      "Partitive and quantity rules follow standard grammar, with the negation rule qualified to preserve important exceptions and contrastive uses.",
  },
  {
    id: "a1-12",
    level: "A1",
    unit: "A1 · Everyday actions",
    title: "Pronominal verbs",
    summary:
      "Describe routines and actions directed back toward the subject.",
    objective:
      "Match a pronominal marker to the subject and place it before the present-tense verb.",
    rule:
      "A pronominal verb uses me, te, se, nous, vous, or se before the conjugated verb. The pronoun must match the subject. French commonly uses a definite article, not a possessive, for body parts when ownership is clear.",
    pattern: "subject + me/te/se/nous/vous/se + conjugated verb",
    examples: [
      { fr: "Je me lève à sept heures.", en: "I get up at seven." },
      { fr: "Nous nous lavons les mains.", en: "We wash our hands." },
    ],
    trap:
      "The two nous in nous nous levons have different jobs: the first is the subject and the second is the pronominal marker.",
    exercise: {
      prompt: "Complete to mean They go to bed early: Elles ___ couchent tôt.",
      options: ["se", "les", "leur"],
      answer: "se",
      rationale: "The third-person plural reflexive pronoun is se.",
    },
    prerequisites: ["a1-03", "a1-09"],
    tags: ["pronominal verbs", "reflexive", "daily routine", "body parts"],
    sourceKeys: ["oqlf", "fei", "tv5"],
    sourceNote:
      "Pronoun placement and body-part determiner usage reflect standard French and common A1 routine contexts.",
  },
  {
    id: "a1-13",
    level: "A1",
    unit: "A1 · Everyday actions",
    title: "The imperative",
    summary: "Give instructions, invitations, and advice.",
    objective:
      "Form affirmative and negative commands with the tu, nous, and vous forms.",
    rule:
      "For most verbs, use the tu, nous, or vous present-indicative form without its subject pronoun. Avoir, être, savoir, and vouloir have irregular imperative forms. In negative commands, ne…pas surrounds the verb. Regular -er verbs normally drop final -s in the tu imperative; the y/en exception is learned later.",
    pattern: "imperative verb + complement · ne + imperative verb + pas",
    examples: [
      {
        fr: "Fermez la porte, s’il vous plaît.",
        en: "Close the door, please.",
      },
      { fr: "Ne parle pas si vite.", en: "Do not speak so quickly." },
    ],
    trap:
      "To form the imperative, omit the subject pronoun: venez. A present-tense clause such as Vous venez ! can also have directive force in context, but it is not an imperative form.",
    exercise: {
      prompt:
        "Complete with the vous imperative: ___ ici, s’il vous plaît.",
      options: ["Venez", "Vous venez", "Venir"],
      answer: "Venez",
      rationale:
        "The vous imperative uses venez without the subject pronoun.",
    },
    prerequisites: ["a1-03", "a1-04", "a1-09"],
    tags: ["imperative", "commands", "negation", "instructions"],
    sourceKeys: ["academie", "oqlf", "tv5"],
    sourceNote:
      "Imperative formation follows standard reference grammar, including a carefully scoped note about the -s and y/en exception.",
  },
  {
    id: "a1-14",
    level: "A1",
    unit: "A1 · Time and events",
    title: "Near future and recent past",
    summary:
      "Speak about a future event anchored in the present or something that has just happened.",
    objective:
      "Build the near future with aller and the recent past with venir de.",
    rule:
      "Form the near future with present-tense aller + infinitive. It often presents the event as connected to the current situation and need not be literally imminent. Form the recent past with present-tense venir + de + infinitive. Only aller or venir is conjugated.",
    pattern: "aller + infinitive · venir de + infinitive",
    examples: [
      { fr: "Je vais appeler Léa.", en: "I am going to call Léa." },
      { fr: "Il vient de partir.", en: "He has just left." },
    ],
    trap:
      "Keep the action verb infinitive: ils vont manger, not ils vont mangent.",
    exercise: {
      prompt: "Which sentence means They are going to eat?",
      options: ["Ils vont manger.", "Ils vont mangé.", "Ils viennent de manger."],
      answer: "Ils vont manger.",
      rationale:
        "The near future is a conjugated form of aller followed by an infinitive.",
    },
    prerequisites: ["a1-04", "fnd-03"],
    tags: ["near future", "recent past", "aller", "venir", "infinitive"],
    sourceKeys: ["fei", "tv5", "academie"],
    sourceNote:
      "Both periphrastic constructions are standard high-frequency A1 forms and are sequenced before more synthetic tense work.",
  },
  {
    id: "a1-15",
    level: "A1",
    unit: "A1 · Time and events",
    title: "Introduction to the passé composé",
    summary: "Report a completed past action using avoir.",
    objective:
      "Build a basic passé composé with avoir and a correct past participle.",
    rule:
      "For most verbs, form the passé composé with present-tense avoir + past participle. Regular -er participles end in -é, finir-type -ir participles in -i, and vendre-type -re participles such as vendu and attendu in -u. Other common participles must be learned.",
    pattern: "subject + present avoir + past participle",
    examples: [
      { fr: "J’ai regardé le film.", en: "I watched the movie." },
      { fr: "Nous avons fini à six heures.", en: "We finished at six o’clock." },
    ],
    trap:
      "With avoir and no preceding direct object, the participle does not agree with the subject: elle a acheté, not elle a achetée.",
    exercise: {
      prompt: "Complete in the passé composé: Elle ___ acheté du pain.",
      options: ["est", "a", "avait"],
      answer: "a",
      rationale:
        "Acheter normally forms the passé composé with present-tense avoir.",
    },
    prerequisites: ["a1-02", "a1-03"],
    tags: ["passé composé", "past participle", "avoir", "past tense"],
    sourceKeys: ["academie", "oqlf", "fei"],
    sourceNote:
      "Formation and agreement scope follow standard grammar; the wording avoids hiding the later preceding-direct-object agreement rule.",
  },
  {
    id: "a2-01",
    level: "A2",
    unit: "A2 · Past narration",
    title: "Passé composé with être",
    summary:
      "Use être with pronominal verbs and with the nonpronominal uses that select it.",
    objective:
      "Choose être where required and make the participle agree in basic cases.",
    rule:
      "All pronominal verbs and certain common verbs in intransitive uses form the passé composé with être. The past participle generally agrees with the subject; more advanced object-based exceptions for pronominal verbs come later.",
    pattern: "subject + present être + agreeing past participle",
    examples: [
      { fr: "Elles sont arrivées hier.", en: "They arrived yesterday." },
      { fr: "Marc s’est levé tôt.", en: "Marc got up early." },
    ],
    trap:
      "Do not assume that every verb of movement uses être; auxiliary choice belongs to the verb and sometimes changes with transitive use.",
    exercise: {
      prompt: "Complete: Lina et Zoé ___ parties à midi.",
      options: ["ont", "sont", "sont été"],
      answer: "sont",
      rationale:
        "Partir selects être, and parties agrees with the feminine plural subject.",
    },
    prerequisites: ["a1-12", "a1-15"],
    tags: ["passé composé", "être", "agreement", "pronominal verbs"],
    sourceKeys: ["academie", "oqlf", "fei"],
    sourceNote:
      "Auxiliary choice and basic agreement are sourced to standard references; the rule explicitly reserves advanced pronominal exceptions.",
  },
  {
    id: "a2-02",
    level: "A2",
    unit: "A2 · Past narration",
    title: "The imparfait",
    summary:
      "Describe past habits, states, background conditions, and actions in progress.",
    objective:
      "Form the imparfait and use it for habitual, descriptive, or ongoing past situations.",
    rule:
      "Take the present nous form, remove -ons, and add -ais, -ais, -ait, -ions, -iez, or -aient. Être alone uses the stem ét-. The imparfait presents a past situation from inside, without marking its endpoint.",
    pattern: "present nous stem minus -ons + imparfait ending",
    examples: [
      {
        fr: "Quand j’étais enfant, je jouais dehors.",
        en: "When I was a child, I used to play outside.",
      },
      {
        fr: "Il pleuvait et les rues étaient calmes.",
        en: "It was raining and the streets were quiet.",
      },
    ],
    trap:
      "Do not choose the imparfait merely because an English sentence uses was or were; choose it for habitual, descriptive, or ongoing viewpoint.",
    exercise: {
      prompt:
        "To present this repeated situation as an unbounded past habit, complete: Tous les étés, nous ___ chez nos grands-parents.",
      options: ["sommes allés", "allions", "irons"],
      answer: "allions",
      rationale:
        "The prompt presents the repeated visits as an unbounded past habit, so the imparfait allions is appropriate.",
    },
    prerequisites: ["a1-03", "a1-04"],
    tags: ["imparfait", "past habits", "description", "background"],
    sourceKeys: ["academie", "oqlf", "fei", "tv5"],
    sourceNote:
      "Formation and core aspectual uses follow standard references and CEFR-aligned instructional practice.",
  },
  {
    id: "a2-03",
    level: "A2",
    unit: "A2 · Past narration",
    title: "Passé composé versus imparfait",
    summary:
      "Combine background and completed events in a coherent past narrative.",
    objective:
      "Choose a past tense from the intended viewpoint rather than from an English tense label.",
    rule:
      "Use the imparfait for setting, state, repetition, or an unfolding action; use the passé composé to present an event as bounded or completed. An ongoing imparfait action is often interrupted by a passé composé event.",
    pattern: "imparfait background + passé composé event",
    examples: [
      {
        fr: "Je lisais quand le téléphone a sonné.",
        en: "I was reading when the phone rang.",
      },
      {
        fr: "Hier, elle a travaillé pendant trois heures.",
        en: "Yesterday, she worked for three hours.",
      },
    ],
    trap:
      "The contrast is about viewpoint, not simply long action versus short action; a long but bounded event can use the passé composé.",
    exercise: {
      prompt:
        "Complete with the tense that presents Paul’s arrival as a single bounded event: Pendant que nous dînions, Paul ___.",
      options: ["arrivait tous les jours", "est arrivé", "était arrivé"],
      answer: "est arrivé",
      rationale:
        "Paul’s arrival is the bounded event occurring during the ongoing dinner.",
    },
    prerequisites: ["a1-15", "a2-01", "a2-02"],
    tags: ["passé composé", "imparfait", "aspect", "narration"],
    sourceKeys: ["fei", "tv5", "academie", "oqlf"],
    sourceNote:
      "The contrast is framed aspectually rather than with the misleading short-versus-long shortcut used in some beginner materials.",
  },
  {
    id: "a2-04",
    level: "A2",
    unit: "A2 · Future and connections",
    title: "Future simple and future time clauses",
    summary: "State future facts, predictions, and plans with the future simple.",
    objective:
      "Form the future simple and use it after future-oriented time conjunctions.",
    rule:
      "Add -ai, -as, -a, -ons, -ez, or -ont to the future stem, often the infinitive; many -re verbs drop final -e. Frequent verbs have irregular stems. French uses a future form after quand, lorsque, or dès que when both clauses refer to the future. The contrast with the futur proche concerns connection to the present, not simply temporal distance.",
    pattern: "future stem + ai/as/a/ons/ez/ont",
    examples: [
      { fr: "Demain, nous partirons tôt.", en: "Tomorrow, we will leave early." },
      {
        fr: "Quand tu arriveras, nous mangerons.",
        en: "When you arrive, we will eat.",
      },
    ],
    trap:
      "Unlike English, French normally uses the future—not the present—after quand for a future event.",
    exercise: {
      prompt:
        "For two future events in standard written French, complete: Dès qu’elle ___ prête, nous sortirons.",
      options: ["est", "sera", "soit"],
      answer: "sera",
      rationale:
        "The readiness is future, so the future form sera follows dès que.",
    },
    prerequisites: ["a1-04", "fnd-03"],
    tags: ["future simple", "future stem", "time clauses", "quand"],
    sourceKeys: ["academie", "oqlf", "fei"],
    sourceNote:
      "Future formation and tense use in future time clauses follow standard French grammar and are contrasted carefully with English usage.",
  },
  {
    id: "a2-05",
    level: "A2",
    unit: "A2 · Pronouns",
    title: "Direct and indirect object pronouns",
    summary:
      "Replace repeated people or things with le, la, les, lui, or leur.",
    objective:
      "Identify a verb's direct or à + person object and replace it with the correct pronoun.",
    rule:
      "Le, la, and les replace a direct object with no preposition. Lui and leur replace many à + person indirect objects. These pronouns normally precede the conjugated verb.",
    pattern: "subject + object pronoun + conjugated verb",
    examples: [
      { fr: "Je vois Clara. → Je la vois.", en: "I see Clara. → I see her." },
      {
        fr: "Nous écrivons à nos amis. → Nous leur écrivons.",
        en: "We write to our friends. → We write to them.",
      },
    ],
    trap:
      "Choose the pronoun from the verb’s construction, not merely from whether the referent is a person: écouter quelqu’un is direct, but téléphoner à quelqu’un is indirect.",
    exercise: {
      prompt: "Replace à Zoé: Tu donnes le livre à Zoé. → Tu ___ donnes le livre.",
      options: ["la", "lui", "leur"],
      answer: "lui",
      rationale:
        "Donner quelque chose à quelqu’un takes an indirect à + person object, replaced by singular lui.",
    },
    prerequisites: ["a1-03", "a1-08"],
    tags: ["object pronouns", "direct object", "indirect object", "le", "lui"],
    sourceKeys: ["oqlf", "academie", "fei"],
    sourceNote:
      "Pronoun selection is tied to verb valency, preventing the common but inaccurate person-equals-indirect shortcut.",
  },
  {
    id: "a2-06",
    level: "A2",
    unit: "A2 · Pronouns",
    title: "Y, en, and preverbal pronoun order",
    summary:
      "Replace place, à + thing, de + thing, and quantities without losing sentence structure.",
    objective:
      "Use y and en accurately and order multiple preverbal object pronouns.",
    rule:
      "Y commonly replaces a place or à + thing. En commonly replaces a de + noun phrase, a partitive noun phrase, or a noun phrase introduced by a number or quantity expression; keep the expressed number or quantity. Before a finite verb, the default order is me/te/se/nous/vous + le/la/les + lui/leur + y + en.",
    pattern: "me/te/se/nous/vous → le/la/les → lui/leur → y → en → verb",
    examples: [
      { fr: "Nous allons au marché. → Nous y allons.", en: "We are going to the market. → We are going there." },
      { fr: "Elle achète deux croissants. → Elle en achète deux.", en: "She buys two croissants. → She buys two." },
    ],
    trap:
      "For a person, normally use lui/leur or à/de + a stressed pronoun as required by the verb; do not mechanically replace every à phrase with y.",
    exercise: {
      prompt: "Replace both objects: Je montre la photo à Paul.",
      options: ["Je lui la montre.", "Je la lui montre.", "Je la montre lui."],
      answer: "Je la lui montre.",
      rationale:
        "In preverbal order, le/la/les comes before lui/leur.",
    },
    prerequisites: ["a2-05", "a1-10", "a1-11"],
    tags: ["y", "en", "pronoun order", "quantity", "place"],
    sourceKeys: ["oqlf", "academie", "fei"],
    sourceNote:
      "Pronoun functions and canonical preverbal order follow standard references; the people-versus-things guidance is deliberately qualified by verb construction.",
  },
  {
    id: "a2-07",
    level: "A2",
    unit: "A2 · Future and connections",
    title: "Relative pronouns qui, que, and où",
    summary: "Join two ideas while avoiding repetition.",
    objective:
      "Select qui, que, or où from the relative pronoun's role inside its clause.",
    rule:
      "Qui is the subject of the following verb; que or qu’ is its direct object; où refers to a place or time. The relative pronoun cannot normally be omitted.",
    pattern: "noun + qui + verb · noun + que + subject + verb · place/time + où + clause",
    examples: [
      {
        fr: "La femme qui parle est ma professeure.",
        en: "The woman who is speaking is my teacher.",
      },
      {
        fr: "Le film que nous regardons a été tourné dans la ville où je suis né.",
        en: "The movie we are watching was shot in the city where I was born.",
      },
    ],
    trap:
      "Qui does not elide before a vowel, but que does: l’homme qui arrive and le film qu’il regarde.",
    exercise: {
      prompt: "Complete: C’est le café ___ nous déjeunons.",
      options: ["qui", "que", "où"],
      answer: "où",
      rationale: "The café is the place where the action occurs.",
    },
    prerequisites: ["fnd-01", "a1-08"],
    tags: ["relative pronouns", "qui", "que", "où", "clauses"],
    sourceKeys: ["oqlf", "academie", "fei"],
    sourceNote:
      "Selection is explained through syntactic function, with elision and obligatory relative marking verified against standard grammar.",
  },
  {
    id: "a2-08",
    level: "A2",
    unit: "A2 · Description and precision",
    title: "Comparatives, superlatives, and adverbs",
    summary: "Compare qualities, actions, and quantities accurately.",
    objective:
      "Build comparisons for adjectives, adverbs, nouns, and verbs and distinguish meilleur from mieux.",
    rule:
      "Use plus, aussi, or moins + adjective/adverb + que. With nouns, use plus/autant/moins de; with verbs, use plus/autant/moins que. Superlatives use the appropriate definite article. Bon becomes meilleur in comparison; bien becomes mieux. Many adverbs are formed with -ment.",
    pattern: "plus/aussi/moins + adjective or adverb + que",
    examples: [
      { fr: "Léa court plus vite que moi.", en: "Léa runs faster than I do." },
      {
        fr: "C’est le meilleur restaurant du quartier.",
        en: "It is the best restaurant in the neighborhood.",
      },
    ],
    trap:
      "Use meilleur to modify a noun and mieux to modify a verb: un meilleur choix, but elle chante mieux.",
    exercise: {
      prompt: "Complete: Paul chante ___ que moi.",
      options: ["meilleur", "mieux", "plus bon"],
      answer: "mieux",
      rationale:
        "The comparison modifies the verb chante, so the comparative of bien is mieux.",
    },
    prerequisites: ["a1-05"],
    tags: ["comparison", "superlative", "adverbs", "meilleur", "mieux"],
    sourceKeys: ["oqlf", "academie", "tv5"],
    sourceNote:
      "Comparison structures and the meilleur/mieux distinction follow standard reference usage, with separate patterns for noun and verb comparison retained.",
  },
  {
    id: "a2-09",
    level: "A2",
    unit: "A2 · Description and precision",
    title: "Expanded negation and indefinite words",
    summary:
      "Express never, nothing, nobody, no longer, and nonspecific people or things.",
    objective:
      "Replace pas with an appropriate negative word and use rien or personne as a subject.",
    rule:
      "Ne combines with jamais, rien, personne, plus, or aucun instead of ordinary pas. Rien and personne can also be subjects: rien ne…, personne ne…. Positive counterparts include quelqu’un, quelque chose, encore, and parfois.",
    pattern: "ne + verb + jamais/rien/personne/plus · rien/personne + ne + verb",
    examples: [
      { fr: "Je ne vois personne.", en: "I do not see anybody." },
      { fr: "Rien ne change.", en: "Nothing changes." },
    ],
    trap:
      "In an ordinary single negative, do not add pas to another negative word: je ne vois personne, not je ne vois pas personne.",
    exercise: {
      prompt: "Complete: Elle ne voyage ___ en hiver.",
      options: ["personne", "jamais", "rien"],
      answer: "jamais",
      rationale:
        "Ne…jamais means never and naturally modifies the frequency of voyager.",
    },
    prerequisites: ["a1-09"],
    tags: ["negation", "indefinites", "jamais", "rien", "personne"],
    sourceKeys: ["oqlf", "academie", "tv5"],
    sourceNote:
      "Negative pairings and subject uses follow standard syntax; the simple-negative scope avoids confusing later emphatic or regional patterns.",
  },
  {
    id: "a2-10",
    level: "A2",
    unit: "A2 · Time, logic, and politeness",
    title: "Depuis, pendant, il y a, and pour",
    summary: "Locate an action in time and express its duration.",
    objective:
      "Choose a time expression according to continuation, bounded duration, elapsed time, or intended duration.",
    rule:
      "Depuis marks an action or state continuing from a starting point to the reference time and normally uses the present when it still continues now. Pendant gives a bounded duration. Il y a means ago. Pour commonly gives an intended or projected duration.",
    pattern: "present + depuis · completed event + pendant · il y a + duration",
    examples: [
      { fr: "J’habite ici depuis 2022.", en: "I have lived here since 2022." },
      {
        fr: "Nous avons attendu pendant une heure.",
        en: "We waited for an hour.",
      },
    ],
    trap:
      "For a situation that began in the past and still holds now, French normally uses present + depuis, not a French past tense.",
    exercise: {
      prompt: "Which sentence means He left three days ago?",
      options: [
        "Il est parti depuis trois jours.",
        "Il est parti pendant trois jours.",
        "Il est parti il y a trois jours.",
      ],
      answer: "Il est parti il y a trois jours.",
      rationale:
        "Il y a + duration locates a completed event that amount of time before now.",
    },
    prerequisites: ["a1-15", "a2-02"],
    tags: ["duration", "depuis", "pendant", "il y a", "pour"],
    sourceKeys: ["oqlf", "fei", "tv5"],
    sourceNote:
      "Temporal contrasts follow standard French usage and preserve the crucial present-plus-depuis difference from English.",
  },
  {
    id: "a2-11",
    level: "A2",
    unit: "A2 · Time, logic, and politeness",
    title: "Cause, consequence, purpose, and real conditions",
    summary:
      "Connect clauses to explain why something happens, its result, its purpose, or a realistic condition.",
    objective:
      "Link basic arguments and form realistic conditions with si + present or, for an already completed condition, si + passé composé.",
    rule:
      "Parce que introduces a cause; donc or alors a consequence; pour + infinitive a purpose when the understood subject is the same. A common realistic-future pattern uses si + present in the condition clause and present, future, or imperative in the result clause. When the condition must be completed before the result, si + passé composé is also possible: si tu as fini, appelle-moi.",
    pattern:
      "si + present, present/future/imperative · si + passé composé, future/imperative · pour + infinitive",
    examples: [
      {
        fr: "Si tu viens demain, nous déjeunerons ensemble.",
        en: "If you come tomorrow, we will have lunch together.",
      },
      {
        fr: "Elle étudie pour réussir son examen.",
        en: "She studies in order to pass her exam.",
      },
    ],
    trap:
      "Do not put the future immediately after conditional si: say si tu viens, not si tu viendras.",
    exercise: {
      prompt: "Complete: Si vous avez le temps, vous ___ le musée.",
      options: ["visiterez", "visiteriez", "avez visité"],
      answer: "visiterez",
      rationale:
        "A realistic future result may use the future after a si + present condition.",
    },
    prerequisites: ["a1-14", "a2-04"],
    tags: ["connectors", "cause", "purpose", "condition", "si clauses"],
    sourceKeys: ["oqlf", "academie", "fei"],
    sourceNote:
      "Connector meanings and the real-condition tense patterns follow standard grammar; pour + infinitive is correctly limited to a shared understood subject.",
  },
  {
    id: "a2-12",
    level: "A2",
    unit: "A2 · Time, logic, and politeness",
    title: "The conditional for polite requests",
    summary: "Make requests and wishes less direct.",
    objective:
      "Use high-frequency conditional forms to make a conventionally polite request.",
    rule:
      "The conditional present normally uses the future stem plus the imparfait endings. At A2, learn high-frequency polite forms such as je voudrais, j’aimerais, pourriez-vous, and voudriez-vous; broader hypothetical uses follow at B1.",
    pattern: "future stem + imparfait ending",
    examples: [
      {
        fr: "Je voudrais un café, s’il vous plaît.",
        en: "I would like a coffee, please.",
      },
      { fr: "Pourriez-vous m’aider ?", en: "Could you help me?" },
    ],
    trap:
      "Je veux is grammatically correct but may sound too direct in a service request; je voudrais is normally more appropriate.",
    exercise: {
      prompt: "Choose the most conventionally polite request.",
      options: [
        "Fermez la fenêtre.",
        "Vous fermez la fenêtre.",
        "Pourriez-vous fermer la fenêtre ?",
      ],
      answer: "Pourriez-vous fermer la fenêtre ?",
      rationale:
        "The conditional pourriez-vous frames the request politely without changing its meaning.",
    },
    prerequisites: ["a2-04"],
    tags: ["conditional", "politeness", "requests", "future stem"],
    sourceKeys: ["academie", "oqlf", "fei", "tv5"],
    sourceNote:
      "Formation is standard; use is deliberately restricted to high-frequency politeness at A2, with counterfactual meanings reserved for B1.",
  },
];
