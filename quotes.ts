export interface Quote {
  text: string;
  author: string;
  theme: string;
}

export const quotes: Quote[] = [
  // ── Failure & Trying Again ─────────────────────────────
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison", theme: "Failure" },
  { text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford", theme: "Failure" },
  { text: "It is impossible to live without failing at something, unless you live so cautiously that you might as well not have lived at all.", author: "J.K. Rowling", theme: "Failure" },
  { text: "I've missed more than 9,000 shots in my career. I've lost almost 300 games. I've failed over and over and over again in my life. And that is why I succeed.", author: "Michael Jordan", theme: "Failure" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", theme: "Failure" },
  { text: "Many of life's failures are people who did not realize how close they were to success when they gave up.", author: "Thomas Edison", theme: "Failure" },
  { text: "The only real mistake is the one from which we learn nothing.", author: "Henry Ford", theme: "Failure" },
  { text: "I can accept failure, everyone fails at something. But I can't accept not trying.", author: "Michael Jordan", theme: "Failure" },
  { text: "There is no failure except in no longer trying.", author: "Elbert Hubbard", theme: "Failure" },
  { text: "You build on failure. You use it as a stepping stone. Close the door on the past.", author: "Johnny Cash", theme: "Failure" },
  { text: "Only those who dare to fail greatly can ever achieve greatly.", author: "Robert F. Kennedy", theme: "Failure" },
  { text: "I have failed over and over again, and that is why I succeed.", author: "Michael Jordan", theme: "Failure" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein", theme: "Failure" },
  { text: "Failure is the condiment that gives success its flavor.", author: "Truman Capote", theme: "Failure" },
  { text: "It's fine to celebrate success but it is more important to heed the lessons of failure.", author: "Bill Gates", theme: "Failure" },

  // ── Rejection ─────────────────────────────
  { text: "The world breaks everyone, and afterward, some are strong at the broken places.", author: "Ernest Hemingway", theme: "Rejection" },
  { text: "You have to fail in order to practice being brave.", author: "Mary Tyler Moore", theme: "Rejection" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford", theme: "Rejection" },
  { text: "Fall seven times, stand up eight.", author: "Japanese proverb", theme: "Rejection" },
  { text: "I was rejected so many times that I could paper my walls with the rejection letters.", author: "Stephen King", theme: "Rejection" },
  { text: "Every no gets me closer to a yes.", author: "Sara Blakely", theme: "Rejection" },
  { text: "Some people won't like you, no matter what you do. Perfect your craft anyway.", author: "Toni Morrison (paraphrased sentiment often cited in interviews)", theme: "Rejection" },
  { text: "The greater the obstacle, the more glory in overcoming it.", author: "Molière", theme: "Rejection" },

  // ── Persistence & Grit ─────────────────────────────
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", theme: "Persistence" },
  { text: "I never dreamed about success. I worked for it.", author: "Estée Lauder", theme: "Persistence" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin", theme: "Persistence" },
  { text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas Edison", theme: "Persistence" },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot", theme: "Persistence" },
  { text: "Patience, persistence and perspiration make an unbeatable combination for success.", author: "Napoleon Hill", theme: "Persistence" },
  { text: "I'm a great believer in luck, and I find the harder I work, the more I have of it.", author: "Thomas Jefferson", theme: "Persistence" },
  { text: "You may encounter many defeats, but you must not be defeated.", author: "Maya Angelou", theme: "Persistence" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", theme: "Persistence" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", theme: "Persistence" },
  { text: "Fall down seven times, get up eight.", author: "Proverb, often attributed in Japanese and Chinese tradition", theme: "Persistence" },
  { text: "Through perseverance many people win success out of what seemed destined to be certain failure.", author: "Benjamin Disraeli", theme: "Persistence" },
  { text: "Great works are performed not by strength but by perseverance.", author: "Samuel Johnson", theme: "Persistence" },
  { text: "Perseverance is failing 19 times and succeeding the 20th.", author: "Julie Andrews", theme: "Persistence" },
  { text: "The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack in will.", author: "Vince Lombardi", theme: "Persistence" },
  { text: "Winners are not afraid of losing. But losers are. Failure is part of the process of success.", author: "Robert T. Kiyosaki", theme: "Persistence" },
  { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi", theme: "Persistence" },
  { text: "Never give up, for that is just the place and time that the tide will turn.", author: "Harriet Beecher Stowe", theme: "Persistence" },
  { text: "Keep your face always toward the sunshine, and shadows will fall behind you.", author: "Walt Whitman", theme: "Persistence" },

  // ── Self-Belief Under Doubt ─────────────────────────────
  { text: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott", theme: "Self-Belief" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", theme: "Self-Belief" },
  { text: "The most difficult thing is the decision to act, the rest is merely tenacity.", author: "Amelia Earhart", theme: "Self-Belief" },
  { text: "If you're going through hell, keep going.", author: "Winston Churchill", theme: "Self-Belief" },
  { text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou", theme: "Self-Belief" },
  { text: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt", theme: "Self-Belief" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", theme: "Self-Belief" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", theme: "Self-Belief" },
  { text: "Confidence comes not from always being right but from not fearing to be wrong.", author: "Peter T. McIntyre", theme: "Self-Belief" },
  { text: "You must do the things you think you cannot do.", author: "Eleanor Roosevelt", theme: "Self-Belief" },
  { text: "The mind is everything. What you think you become.", author: "Buddha", theme: "Self-Belief" },
  { text: "I am the greatest, I said that even before I knew I was.", author: "Muhammad Ali", theme: "Self-Belief" },
  { text: "It's not the mountains ahead to climb that wear you out; it's the pebble in your shoe.", author: "Muhammad Ali", theme: "Self-Belief" },
  { text: "Champions aren't made in gyms. Champions are made from something they have deep inside them.", author: "Muhammad Ali", theme: "Self-Belief" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche (popularized by Viktor Frankl)", theme: "Self-Belief" },
  { text: "Everything can be taken from a man but one thing: the last of the human freedoms — to choose one's attitude in any given set of circumstances.", author: "Viktor Frankl", theme: "Self-Belief" },

  // ── Starting Over / Reinvention ─────────────────────────────
  { text: "It is never too late to be what you might have been.", author: "George Eliot", theme: "Reinvention" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis", theme: "Reinvention" },
  { text: "Sometimes you have to let everything go — purge yourself. If you are free, your true creativity, your true self comes out.", author: "Tina Turner", theme: "Reinvention" },
  { text: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.", author: "Socrates", theme: "Reinvention" },
  { text: "Life isn't about finding yourself. Life is about creating yourself.", author: "George Bernard Shaw", theme: "Reinvention" },
  { text: "And the day came when the risk to remain tight in a bud was more painful than the risk it took to blossom.", author: "Anaïs Nin", theme: "Reinvention" },

  // ── Hardship & Adversity ─────────────────────────────
  { text: "The oak fought the wind and was broken, the willow bent when it must and survived.", author: "Robert Jordan", theme: "Hardship" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche", theme: "Hardship" },
  { text: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.", author: "Kahlil Gibran", theme: "Hardship" },
  { text: "I learned that courage was not the absence of fear, but the triumph over it. The brave man is not he who does not feel afraid, but he who conquers that fear.", author: "Nelson Mandela", theme: "Hardship" },
  { text: "The gem cannot be polished without friction, nor man perfected without trials.", author: "Confucius", theme: "Hardship" },
  { text: "Difficulties in life are intended to make us better, not bitter.", author: "Dan Reeves", theme: "Hardship" },
  { text: "When you go through hardship and decide not to surrender, that is strength.", author: "Arnold Schwarzenegger", theme: "Hardship" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein", theme: "Hardship" },
  { text: "Smooth seas do not make skillful sailors.", author: "African proverb", theme: "Hardship" },
  { text: "Adversity introduces a man to himself.", author: "Albert Einstein (commonly attributed, though disputed)", theme: "Hardship" },
  { text: "The struggle you're in today is developing the strength you need for tomorrow.", author: "Robert Tew", theme: "Hardship" },
  { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller", theme: "Hardship" },
  { text: "The human capacity for burden is like bamboo — far more flexible than you'd ever believe at first glance.", author: "Jodi Picoult", theme: "Hardship" },
  { text: "What doesn't kill you makes you stronger, stand a little taller.", author: "Kelly Clarkson (song lyric, popular culture reference)", theme: "Hardship" },

  // ── Vision & Long-Term Thinking ─────────────────────────────
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", theme: "Vision" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", theme: "Vision" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein", theme: "Vision" },
  { text: "I have no special talents. I am only passionately curious.", author: "Albert Einstein", theme: "Vision" },
  { text: "Do not judge me by my success, judge me by how many times I fell down and got back up again.", author: "Nelson Mandela", theme: "Vision" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison", theme: "Vision" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", theme: "Vision" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", theme: "Vision" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington", theme: "Vision" },
  { text: "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did do.", author: "Mark Twain", theme: "Vision" },
  { text: "The best way to predict the future is to create it.", author: "Abraham Lincoln (widely attributed, popularized by Peter Drucker)", theme: "Vision" },
  { text: "Imagination is more important than knowledge.", author: "Albert Einstein", theme: "Vision" },
  { text: "Whatever you can do, or dream you can, begin it. Boldness has genius, power, and magic in it.", author: "Johann Wolfgang von Goethe (commonly attributed)", theme: "Vision" },

  // ── Discipline When Motivation Fades ─────────────────────────────
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", theme: "Discipline" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant, paraphrasing Aristotle", theme: "Discipline" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun", theme: "Discipline" },
  { text: "The pain of discipline is far less than the pain of regret.", author: "Sarah Bombell", theme: "Discipline" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King", theme: "Discipline" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln (widely attributed, disputed origin)", theme: "Discipline" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John C. Maxwell", theme: "Discipline" },
  { text: "It's not about having time, it's about making time.", author: "Anonymous, widely used in productivity culture", theme: "Discipline" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee", theme: "Discipline" },
  { text: "Long-term consistency trumps short-term intensity.", author: "Bruce Lee", theme: "Discipline" },

  // ── Overcoming the Odds ─────────────────────────────
  { text: "I was told over and over that this business is a marathon, not a sprint, and I had to learn to be patient.", author: "Oprah Winfrey", theme: "Overcoming Odds" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey", theme: "Overcoming Odds" },
  { text: "I don't measure a man's success by how high he climbs but how high he bounces when he hits bottom.", author: "George S. Patton", theme: "Overcoming Odds" },
  { text: "You may have to fight a battle more than once to win it.", author: "Margaret Thatcher", theme: "Overcoming Odds" },
  { text: "Man cannot discover new oceans unless he has the courage to lose sight of the shore.", author: "André Gide", theme: "Overcoming Odds" },
  { text: "Nothing in the world can take the place of persistence. Talent will not; genius will not; education will not.", author: "Calvin Coolidge", theme: "Overcoming Odds" },
  { text: "If you cannot fly then run, if you cannot run then walk, if you cannot walk then crawl, but whatever you do you have to keep moving forward.", author: "Martin Luther King Jr.", theme: "Overcoming Odds" },
  { text: "We know what we are, but know not what we may be.", author: "William Shakespeare", theme: "Overcoming Odds" },
  { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo", theme: "Overcoming Odds" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", theme: "Overcoming Odds" },

  // ── Facing Ridicule & Criticism ─────────────────────────────
  { text: "It is hard to fail, but it is worse never to have tried to succeed.", author: "Theodore Roosevelt", theme: "Criticism" },
  { text: "I would rather walk with a friend in the dark, than alone in the light.", author: "Helen Keller", theme: "Criticism" },
  { text: "Criticism, like rain, should be gentle enough to nourish a man's growth without destroying his roots.", author: "Frank A. Clark", theme: "Criticism" },
  { text: "Do what you feel in your heart to be right, for you'll be criticized anyway.", author: "Eleanor Roosevelt", theme: "Criticism" },
  { text: "It is not the critic who counts; the credit belongs to the man who is actually in the arena.", author: "Theodore Roosevelt", theme: "Criticism" },
  { text: "The man who has no imagination has no wings.", author: "Muhammad Ali", theme: "Criticism" },
  { text: "Silence is the ultimate weapon of power.", author: "Charles de Gaulle", theme: "Criticism" },
  { text: "What people think of you is none of your business.", author: "Widely attributed, common in modern resilience writing", theme: "Criticism" },

  // ── The Long Game (Building Something) ─────────────────────────────
  { text: "Build your own dreams, or someone else will hire you to build theirs.", author: "Farrah Gray", theme: "Long Game" },
  { text: "It's not about ideas. It's about making ideas happen.", author: "Scott Belsky", theme: "Long Game" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese proverb", theme: "Long Game" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb", theme: "Long Game" },
  { text: "Rome wasn't built in a day, but they were laying bricks every hour.", author: "John Heywood (proverb origin)", theme: "Long Game" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle", theme: "Long Game" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier", theme: "Long Game" },
  { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson", theme: "Long Game" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin", theme: "Long Game" },
  { text: "You don't need a new plan for next year. You need a commitment.", author: "Unattributed, common in productivity circles", theme: "Long Game" },

  // ── Entrepreneurs & Builders ─────────────────────────────
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", theme: "Entrepreneurship" },
  { text: "I'm convinced that about half of what separates successful entrepreneurs from the non-successful ones is pure perseverance.", author: "Steve Jobs", theme: "Entrepreneurship" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs", theme: "Entrepreneurship" },
  { text: "Sometimes life is going to hit you in the head with a brick. Don't lose faith.", author: "Steve Jobs", theme: "Entrepreneurship" },
  { text: "Whatever the mind can conceive and believe, it can achieve.", author: "Napoleon Hill", theme: "Entrepreneurship" },
  { text: "If you really look closely, most overnight successes took a long time.", author: "Steve Jobs", theme: "Entrepreneurship" },
  { text: "The people who are crazy enough to think they can change the world are the ones who do.", author: "Steve Jobs", theme: "Entrepreneurship" },
  { text: "I think it is possible for ordinary people to choose to be extraordinary.", author: "Elon Musk", theme: "Entrepreneurship" },
  { text: "When something is important enough, you do it even if the odds are not in your favor.", author: "Elon Musk", theme: "Entrepreneurship" },
  { text: "Persistence is very important. You should not give up unless you are forced to give up.", author: "Elon Musk", theme: "Entrepreneurship" },
  { text: "It's not about capital, it's persistence.", author: "Jack Ma", theme: "Entrepreneurship" },
  { text: "Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine.", author: "Jack Ma", theme: "Entrepreneurship" },
  { text: "Never give up. Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine.", author: "Jack Ma", theme: "Entrepreneurship" },
  { text: "If you don't give up, you still have a chance. Giving up is the greatest failure.", author: "Jack Ma", theme: "Entrepreneurship" },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates", theme: "Entrepreneurship" },
  { text: "Success is a lousy teacher. It seduces smart people into thinking they can't lose.", author: "Bill Gates", theme: "Entrepreneurship" },
  { text: "I failed my way to success.", author: "Colonel Harland Sanders (attributed, KFC founder started at 65)", theme: "Entrepreneurship" },
  { text: "Business opportunities are like buses, there's always another one coming.", author: "Richard Branson", theme: "Entrepreneurship" },
  { text: "You don't learn to walk by following rules. You learn by doing, and by falling over.", author: "Richard Branson", theme: "Entrepreneurship" },
  { text: "If somebody offers you an amazing opportunity but you are not sure you can do it, say yes — then learn how to do it later.", author: "Richard Branson", theme: "Entrepreneurship" },
  { text: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss", theme: "Entrepreneurship" },
  { text: "The size of your success is measured by the strength of your desire; the size of your dream; and how you handle disappointment along the way.", author: "Robert Kiyosaki", theme: "Entrepreneurship" },
  { text: "Do not be embarrassed by your failures, learn from them and start again.", author: "Richard Branson", theme: "Entrepreneurship" },

  // ── Athletes on Discipline & Pain ─────────────────────────────
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke (commonly cited by athletes)", theme: "Athletics" },
  { text: "I've failed over and over and over again in my life and that is why I succeed.", author: "Michael Jordan", theme: "Athletics" },
  { text: "The moment you give up is the moment you let someone else win.", author: "Kobe Bryant", theme: "Athletics" },
  { text: "Everything negative — pressure, challenges — is all an opportunity for me to rise.", author: "Kobe Bryant", theme: "Athletics" },
  { text: "I have self-doubt. I have insecurity. I have fear of failure. I have nights when I show up and I don't have it, I'm shitting bricks.", author: "Kobe Bryant", theme: "Athletics" },
  { text: "Rest at the end, not in the middle.", author: "Muhammad Ali", theme: "Athletics" },
  { text: "I hated every minute of training, but I said, don't quit. Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali", theme: "Athletics" },
  { text: "It's the repetition of affirmations that leads to belief. And once that belief becomes a deep conviction, things begin to happen.", author: "Muhammad Ali", theme: "Athletics" },
  { text: "I've never lost a fight. I just ran out of time.", author: "Floyd Mayweather Jr.", theme: "Athletics" },
  { text: "Pain is temporary. It may last a minute, or an hour, or a day, or a year, but eventually it will subside and something else will take its place. If I quit, however, it lasts forever.", author: "Lance Armstrong", theme: "Athletics" },
  { text: "Champions keep playing until they get it right.", author: "Billie Jean King", theme: "Athletics" },
  { text: "You have to expect things of yourself before you can do them.", author: "Michael Jordan", theme: "Athletics" },
  { text: "Talent wins games, but teamwork and intelligence win championships.", author: "Michael Jordan", theme: "Athletics" },

  // ── Writers & Artists on Struggle ─────────────────────────────
  { text: "There is nothing to writing. All you do is sit down at a typewriter and bleed.", author: "Ernest Hemingway", theme: "Creative Struggle" },
  { text: "The scariest moment is always just before you start.", author: "Stephen King", theme: "Creative Struggle" },
  { text: "You can, you should, and if you're brave enough to start, you will.", author: "Stephen King", theme: "Creative Struggle" },
  { text: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling", theme: "Creative Struggle" },
  { text: "It is our choices that show what we truly are, far more than our abilities.", author: "J.K. Rowling", theme: "Creative Struggle" },
  { text: "Failure gave me an inner security that I had never attained by passing examinations.", author: "J.K. Rowling", theme: "Creative Struggle" },
  { text: "I have to keep reminding myself that some things, broken, can be fixed. Bent, but not broken.", author: "Toni Morrison (paraphrase from her writing style, verify before public use)", theme: "Creative Struggle" },
  { text: "You don't write because you want to say something, you write because you have something to say.", author: "F. Scott Fitzgerald", theme: "Creative Struggle" },
  { text: "Great artists suffer for the people. They lay their lives on the line.", author: "Nina Simone", theme: "Creative Struggle" },
  { text: "I dream my painting and I paint my dream.", author: "Vincent van Gogh", theme: "Creative Struggle" },
  { text: "If you hear a voice within you say 'you cannot paint,' then by all means paint, and that voice will be silenced.", author: "Vincent van Gogh", theme: "Creative Struggle" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh", theme: "Creative Struggle" },

  // ── Leaders on Struggle & Justice ─────────────────────────────
  { text: "A good head and a good heart are always a formidable combination.", author: "Nelson Mandela", theme: "Leadership" },
  { text: "May your choices reflect your hopes, not your fears.", author: "Nelson Mandela", theme: "Leadership" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", theme: "Leadership" },
  { text: "I am the master of my fate, I am the captain of my soul.", author: "William Ernest Henley, from the poem 'Invictus' — a favorite of Mandela's during imprisonment", theme: "Leadership" },
  { text: "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.", author: "Martin Luther King Jr.", theme: "Leadership" },
  { text: "The ultimate measure of a man is not where he stands in moments of comfort and convenience, but where he stands at times of challenge and controversy.", author: "Martin Luther King Jr.", theme: "Leadership" },
  { text: "Our lives begin to end the day we become silent about things that matter.", author: "Martin Luther King Jr.", theme: "Leadership" },
  { text: "I raise up my voice, not so I can shout, but so that those without a voice can be heard.", author: "Malala Yousafzai", theme: "Leadership" },
  { text: "When the whole world is silent, even one voice becomes powerful.", author: "Malala Yousafzai", theme: "Leadership" },
  { text: "I don't want to be remembered as the girl who was shot. I want to be remembered as the girl who fought for education.", author: "Malala Yousafzai", theme: "Leadership" },
  { text: "Freedom is never voluntarily given by the oppressor; it must be demanded by the oppressed.", author: "Martin Luther King Jr.", theme: "Leadership" },
  { text: "Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.", author: "Theodore Roosevelt", theme: "Leadership" },
  { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost", theme: "Leadership" },

  // ── Scientists & Thinkers ─────────────────────────────
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", theme: "Science & Thought" },
  { text: "Try not to become a man of success, but rather try to become a man of value.", author: "Albert Einstein", theme: "Science & Thought" },
  { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein", theme: "Science & Thought" },
  { text: "However difficult life may seem, there is always something you can do and succeed at.", author: "Stephen Hawking", theme: "Science & Thought" },
  { text: "My advice to other disabled people would be, concentrate on things your disability doesn't prevent you from doing well, and don't regret the things it interferes with.", author: "Stephen Hawking", theme: "Science & Thought" },
  { text: "Look up at the stars and not down at your feet. Try to make sense of what you see, and wonder about what makes the universe exist.", author: "Stephen Hawking", theme: "Science & Thought" },
  { text: "Intelligence is the ability to adapt to change.", author: "Stephen Hawking", theme: "Science & Thought" },
  { text: "Not everything that counts can be counted, and not everything that can be counted counts.", author: "Attributed to William Bruce Cameron, often misattributed to Einstein", theme: "Science & Thought" },
  { text: "The only source of knowledge is experience.", author: "Albert Einstein", theme: "Science & Thought" },

  // ── Stoic & Philosophical ─────────────────────────────
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", theme: "Stoicism" },
];

export default quotes;

// ── Helpers ─────────────────────────────
export const getRandomQuote = (): Quote =>
  quotes[Math.floor(Math.random() * quotes.length)];

export const getQuoteByTheme = (theme: string): Quote[] =>
  quotes.filter((q) => q.theme.toLowerCase() === theme.toLowerCase());

export const getDailyQuote = (): Quote => {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return quotes[dayIndex % quotes.length];
};