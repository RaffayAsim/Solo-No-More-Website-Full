/**
 * Copy for the SEO landing pages (/karachi, /lahore, /islamabad, /things-to-do/*).
 * Only true statements: well-known public places and how Solo-No-More actually works.
 * No invented member counts, ratings or testimonials.
 */

export type CityKey = "karachi" | "lahore" | "islamabad";
export type ActivityKey = "padel" | "chai-and-food" | "live-music" | "board-games";

export interface FaqItem {
  q: string;
  a: string;
}

export const CITY_PAGES: Record<
  CityKey,
  {
    name: "Karachi" | "Lahore" | "Islamabad";
    title: string;
    description: string;
    h1: string;
    intro: string[];
    spots: { area: string; idea: string }[];
    faq: FaqItem[];
  }
> = {
  karachi: {
    name: "Karachi",
    title: "Things to Do in Karachi With New People — Meetups, Padel & Chai | Solo-No-More",
    description:
      "Find people to hang out with in Karachi. Join vetted squads for padel, chai runs, food streets, gigs and sea-side evenings — or host your own beacon in seconds.",
    h1: "Things to do in Karachi — with people who actually show up",
    intro: [
      "Karachi never sleeps, but making plans in it can be surprisingly lonely. Friends move away, group chats go quiet, and the padel court you wanted needs four players, not one.",
      "Solo-No-More is a members' community for Karachi that turns “anyone free tonight?” into a real plan. Members drop a beacon for what they want to do — a chai run, a padel match, a gig — and other vetted members ask to join. The host approves who comes, and everyone meets in a public place.",
    ],
    spots: [
      { area: "Clifton & Sea View", idea: "Evening walks, beach sunsets and late-night food along the coast." },
      { area: "DHA & Clifton padel courts", idea: "Padel doubles — the easiest beacon to fill when you are one player short." },
      { area: "Boat Basin & Burns Road", idea: "Food-street crawls, chai and the city’s best late-night bites." },
      { area: "Port Grand", idea: "Group dinners and harbour views for a relaxed first hangout." },
      { area: "Cafés across Tariq Road, Bahadurabad & DHA", idea: "Board games, coffee meetups and co-working afternoons." },
    ],
    faq: [
      {
        q: "How do I meet new people in Karachi?",
        a: "Join Solo-No-More, pick what you enjoy (padel, chai, gigs, food walks) and either join a beacon someone else posted or post your own. Every member is reviewed by our team before they can join hangouts.",
      },
      {
        q: "Is it safe to meet strangers through Solo-No-More?",
        a: "Members apply with their CNIC, phone number and an emergency contact, and our team reviews every application. Hosts approve each person who asks to join, and hangouts happen in public places such as cafés, courts and restaurants.",
      },
      {
        q: "Which areas of Karachi are covered?",
        a: "Beacons can be posted anywhere in Karachi — Clifton, DHA, Gulshan, PECHS, North Nazimabad and beyond. You see hangouts in your city and choose the ones that suit you.",
      },
      {
        q: "How much does it cost?",
        a: "You can sign up as a guest for free. Full membership (Solo Pass Pro) unlocks hosting and joining squads — see the Memberships page for current prices.",
      },
    ],
  },
  lahore: {
    name: "Lahore",
    title: "Things to Do in Lahore With New People — Meetups, Food & Padel | Solo-No-More",
    description:
      "Find people to hang out with in Lahore. Join vetted squads for food streets, padel, chai, gigs and weekend plans across Gulberg, DHA and the Walled City.",
    h1: "Things to do in Lahore — find your people, not just a plan",
    intro: [
      "Lahore is made for going out — food streets, music nights, late chai — but it is more fun with a group. When your usual crowd is busy, it is easy to end up staying home.",
      "Solo-No-More connects vetted members in Lahore who want to do the same thing at the same time. Post a beacon for your plan, approve who joins, and meet in a public spot. Or browse what others are planning and ask to come along.",
    ],
    spots: [
      { area: "Fort Road Food Street & the Walled City", idea: "Heritage food walks with views of the Badshahi Mosque." },
      { area: "MM Alam Road & Gulberg", idea: "Dinners, desserts and café-hopping with a small squad." },
      { area: "DHA & Gulberg padel courts", idea: "Weeknight padel doubles and weekend tournaments." },
      { area: "Liberty & Packages Mall area", idea: "Easy meeting points for movies, shopping and food." },
      { area: "Cafés and gig venues across the city", idea: "Live music nights, open mics and board-game evenings." },
    ],
    faq: [
      {
        q: "How do I make friends in Lahore?",
        a: "Join Solo-No-More, choose your interests and join beacons posted by other members — or post your own plan and approve who comes. It is built for people who are new to the city or whose friends have moved on.",
      },
      {
        q: "Is Solo-No-More safe for women in Lahore?",
        a: "Every member is reviewed by our team (CNIC, phone and an emergency contact), hosts approve everyone who joins their beacon, and meetups happen in public places. You choose who you meet.",
      },
      {
        q: "What kind of hangouts happen in Lahore?",
        a: "Food walks, padel, chai runs, live music, movie nights and board-game evenings — anything members want to do with a few more people.",
      },
      {
        q: "Do I have to pay to join?",
        a: "Guest signup is free. Full membership unlocks hosting and joining squads; current prices are on the Memberships page.",
      },
    ],
  },
  islamabad: {
    name: "Islamabad",
    title: "Things to Do in Islamabad With New People — Hikes, Chai & Padel | Solo-No-More",
    description:
      "Find people to hang out with in Islamabad and Rawalpindi. Join vetted squads for Margalla hikes, Kohsar Market chai, padel and weekend plans.",
    h1: "Things to do in Islamabad — hikes, chai and new people",
    intro: [
      "Islamabad has the trails, the cafés and the calm — but weekend plans still need people. If you have just moved for work or study, finding a group can take months.",
      "Solo-No-More is a vetted members' community where people in Islamabad post beacons for what they want to do, from a sunrise hike to a padel match, and approve who joins. Everyone meets in public places, and every member is reviewed by our team.",
    ],
    spots: [
      { area: "Margalla Hills trails", idea: "Group hikes on the Trail 3 and Trail 5 routes — better with company." },
      { area: "Daman-e-Koh & Pir Sohawa", idea: "Viewpoints, sunsets and dinners above the city." },
      { area: "Kohsar Market & Jinnah Super (F-6/F-7)", idea: "Chai, coffee and bookshop afternoons." },
      { area: "Padel courts across Islamabad", idea: "Padel doubles when you are a player or two short." },
      { area: "Centaurus & Blue Area", idea: "Movies, food courts and easy meeting points." },
    ],
    faq: [
      {
        q: "How do I meet new people in Islamabad?",
        a: "Sign up, pick your interests and join a beacon — a hike, chai, padel or dinner — or post your own and approve who joins. It works well for people new to the city for a job or university.",
      },
      {
        q: "Does Solo-No-More cover Rawalpindi too?",
        a: "Yes — members in Rawalpindi can join and host beacons in the twin cities. Choose Islamabad or Rawalpindi when you sign up.",
      },
      {
        q: "How are members vetted?",
        a: "Applicants share their CNIC, phone number and an emergency contact, and our team reviews each application before it is approved. Hosts then approve who joins each hangout.",
      },
      {
        q: "What does it cost?",
        a: "Guest signup is free. Full membership unlocks hosting and joining squads — see the Memberships page for current prices.",
      },
    ],
  },
};

export const ACTIVITY_PAGES: Record<
  ActivityKey,
  { name: string; title: string; description: string; h1: string; intro: string[]; tips: string[]; faq: FaqItem[] }
> = {
  padel: {
    name: "Padel",
    title: "Find Padel Partners in Karachi, Lahore & Islamabad | Solo-No-More",
    description:
      "Short of players for padel? Post a padel beacon and get vetted players to join your doubles game in Karachi, Lahore or Islamabad.",
    h1: "Find padel partners — never be the fourth player missing",
    intro: [
      "Padel is played in doubles, which means you need three other people free at the same time. That is often the hardest part of the game.",
      "On Solo-No-More you post a padel beacon with the court, time and your level. Vetted members ask to join, you approve who plays, and the squad chat sorts out who brings balls.",
    ],
    tips: [
      "Say your level (beginner, intermediate, advanced) in the beacon so the game is fun for everyone.",
      "Mention whether the court is already booked and how the court fee will be split.",
      "Weeknight evening slots fill fastest — post a day or two ahead.",
    ],
    faq: [
      { q: "I am a beginner. Can I still join?", a: "Yes. Many members post beginner-friendly games — look for beacons that mention your level, or post your own and say you are new." },
      { q: "Who books and pays for the court?", a: "Usually the host books the court and the fee is split between players. Agree the details in the squad chat before the game." },
    ],
  },
  "chai-and-food": {
    name: "Chai & food walks",
    title: "Chai Runs & Food Street Meetups in Pakistan | Solo-No-More",
    description:
      "Join a chai run or food-street crawl with vetted members in Karachi, Lahore and Islamabad — or host your own in seconds.",
    h1: "Chai runs and food walks — better with a squad",
    intro: [
      "Some of the best plans are the simplest: a dhaba at midnight, a food street on a Friday, a new café everyone keeps talking about.",
      "Post a chai or food beacon with the spot and time, approve who joins, and meet up. It is the easiest way to try somewhere new without going alone.",
    ],
    tips: [
      "Pick a well-known, public spot for a first meetup.",
      "Say if it is a quick chai or a long food crawl so people know what to expect.",
      "Mention a rough budget per person.",
    ],
    faq: [
      { q: "How many people join a food walk?", a: "The host sets the group size when posting the beacon — from a small table of three to a bigger squad." },
      { q: "Who pays?", a: "Everyone usually pays for themselves. Agree in the squad chat if you plan to split the bill." },
    ],
  },
  "live-music": {
    name: "Live music & gigs",
    title: "Go to Concerts & Gigs With a Group in Pakistan | Solo-No-More",
    description:
      "Don’t miss a gig because no one is free. Find vetted members to go to concerts, open mics and music nights with in Karachi, Lahore and Islamabad.",
    h1: "Gigs, concerts and music nights — find your crew",
    intro: [
      "Plenty of good gigs get missed because nobody else could make it. Going alone is fine — going with a few people who love the same music is better.",
      "Post a beacon for the gig you are going to, or browse Solo-No-More events and book a pass. Squad chats help you plan the meeting point before the show.",
    ],
    tips: [
      "Link the event or venue in your beacon so people can check tickets.",
      "Agree a meeting point before the doors open.",
      "Artists and organisers can list ticketed gigs through the Partner & Artist Portal.",
    ],
    faq: [
      { q: "Can I buy event tickets on Solo-No-More?", a: "Yes. Events listed on our Events page can be booked online; your pass is a QR code scanned at the door." },
      { q: "I am an artist. Can I list my gig?", a: "Yes — apply through the Partner & Artist Portal. Once approved you can list gigs, sell passes and scan guests at the door." },
    ],
  },
  "board-games": {
    name: "Board games & game nights",
    title: "Board Game Nights & Café Meetups in Pakistan | Solo-No-More",
    description:
      "Find people for board games, card games and café game nights in Karachi, Lahore and Islamabad — vetted members, public venues.",
    h1: "Board games and game nights — bring the players, not just the box",
    intro: [
      "Board games need players. Whether it is a quick round of cards or a long strategy game, it is hard to get a group together on short notice.",
      "Post a game-night beacon at a café, say which games you are bringing, and approve who joins. It is one of the friendliest first hangouts for people who are new to the city.",
    ],
    tips: [
      "Say which games you are bringing and whether newcomers are welcome to learn.",
      "Board-game cafés are great public venues for a first meetup.",
      "Keep the first game short so everyone gets comfortable.",
    ],
    faq: [
      { q: "Do I need to own games?", a: "No — many hosts bring their own, and board-game cafés have shelves of games to borrow." },
      { q: "Is it beginner friendly?", a: "Most game nights are. Look for beacons that say “all levels welcome”, or post your own." },
    ],
  },
};

export const CITY_KEYS = Object.keys(CITY_PAGES) as CityKey[];
export const ACTIVITY_KEYS = Object.keys(ACTIVITY_PAGES) as ActivityKey[];
