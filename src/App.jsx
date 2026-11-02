import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import ZoomExplore from './ZoomExplore';
import RouteExplorer from './RouteExplorer';
import PlaceMap from './PlaceMap';
import { getCoords } from './placeCoords';

/* ---------- EXPLORE CATEGORIES ---------- */
const CATEGORIES = [
  { id: 'travel', title: 'Travel Places', sub: 'Cities and towns worth a stop', img: '/categories/travel.jpg' },
  { id: 'historical', title: 'Historical Places', sub: 'Forts, palaces and havelis', img: '/categories/historical.jpg' },
  { id: 'temples', title: 'Temples & Religious Places', sub: 'Pilgrimage towns and sacred sites', img: '/categories/temples.jpg' },
  { id: 'markets', title: 'Markets & Shopping', sub: 'Bazaars, crafts and jewellery', img: '/categories/markets.jpg' },
  { id: 'parks', title: 'Parks & Gardens', sub: 'Green escapes and lakeside walks', img: '/categories/parks.jpg' },
  { id: 'museums', title: 'Museums & Art Galleries', sub: 'Royal history and living art', img: '/categories/museums.jpg' },
  { id: 'adventure', title: 'Adventure & Activities', sub: 'Safaris, treks and desert fun', img: '/categories/adventure.jpg' },
  { id: 'culture', title: 'Local Culture & Festivals', sub: 'Folk arts, food and fairs', img: '/categories/culture.jpg' },
];

/* ---------- PLACES ----------*/
const TRAVEL = [
  { name: "Udaipur", tag: "City of Lakes", blurb: "Famous for Lake Pichola, Fateh Sagar and Rajasthan's most romantic palace-and-lake setting. Boat rides on Lake Pichola run roughly 10 AM to sunset. Prices vary by boat and route. Best time: October to March.",img: '/travel/udaipur.jpg' },
  { name: "Mount Abu", tag: "Rajasthan's only hill station", blurb: "Famous for Nakki Lake, cool weather and sunset views. Guru Shikhar (about 1,722 m) is the highest peak in the Aravalli range. Best time: October to March, and also the monsoon for greenery." },
  { name: "Pushkar", tag: "Sacred town", blurb: "A sacred town around Pushkar Lake, with 52 bathing ghats. It is a pilgrimage centre and a backpacker favourite. The town is vegetarian and alcohol-free. Best time: October to March." },
  { name: "Sam Sand Dunes and Khuhri", tag: "Thar Desert dunes", blurb: "Thar Desert dunes about 40 km from Jaisalmer, known for camel rides, sunset points and desert camps. Best time: October to February." },
  { name: "Kuldhara", tag: "Abandoned village", blurb: "An abandoned 13th-century Paliwal village, famous for its ghost-town legends. Open during daylight with a small ASI-type ticket." },
  { name: "Bundi", tag: "Quiet old town", blurb: "A quiet old town known for Taragarh Fort, Garh Palace murals and Raniji ki Baori (stepwell). Less crowded than Jaipur or Udaipur." },
  { name: "Shekhawati", tag: "Open-air art gallery", blurb: "Called the \"open-air art gallery\" for its painted havelis in Mandawa, Nawalgarh and Fatehpur. The frescoes show gods, trains and British-era scenes." },
  { name: "Abhaneri (Chand Baori)", tag: "Stepwell", blurb: "One of the deepest and most photographed stepwells in India, with about 3,500 narrow steps in 13 levels. It dates to roughly the 8th-9th century. Entry is usually free or very low-cost, so verify." },
  { name: "Jal Mahal", tag: "Palace on the lake", blurb: "A palace in the middle of Man Sagar Lake, best photographed from the roadside promenade. Visitors cannot normally enter the building." },
];

const HISTORICAL = [
  { name: "Amber (Amer) Fort", tag: "Jaipur", blurb: "Begun in 1592 by Raja Man Singh I. Famous for Sheesh Mahal (mirror palace), Ganesh Pol and its hilltop views. Timings: about 8 AM to 5:30 PM. There is an evening light and sound show (separate ticket). Elephant rides have been restricted or changed in recent years, so check." },
  { name: "City Palace, Jaipur", tag: "Jaipur", blurb: "Still the residence of the royal family, with museums, courtyards and Chandra Mahal. Privately run, with a standard museum ticket of ₹400 (concessions available). Typical hours: 9:30 AM to 5 PM." },
  { name: "Hawa Mahal", tag: "Jaipur", blurb: "Built in 1799 by Maharaja Sawai Pratap Singh. A five-storey pink sandstone facade with 953 small windows, designed so royal women could watch street life unseen. Timings about 9 AM to 5 PM." },
  { name: "Jantar Mantar", tag: "Jaipur", blurb: "An 18th-century astronomical observatory built by Sawai Jai Singh II, and a UNESCO site. It has the world's largest stone sundial (Samrat Yantra). Typical hours: 9 AM to 4:30 PM." },
  { name: "Nahargarh and Jaigarh Forts", tag: "Jaipur", blurb: "Hill forts above the city. Nahargarh is known for sunset views, Jaigarh for the huge Jaivana Cannon." },
  { name: "Mehrangarh Fort", tag: "Jodhpur", blurb: "Founded in 1459 by Rao Jodha on a 125 m cliff. Famous for palaces, a museum and views over the \"Blue City\". Run by a trust with a good museum and audio guide. Typical hours: 9 AM to 5 PM." },
  { name: "Jaswant Thada", tag: "Jodhpur", blurb: "A white marble royal cenotaph from 1899, sometimes called the \"Taj Mahal of Marwar\". Small entry fee." },
  { name: "Jaisalmer Fort (Sonar Quila)", tag: "Jaisalmer", blurb: "Built in 1156 by Rawal Jaisal. A \"living fort\" where families still live inside, glowing golden at sunset. Walking in is free; the palace museum and some sites inside are ticketed." },
  { name: "Chittorgarh Fort", tag: "Chittorgarh", blurb: "One of India's largest forts. Famous for Vijay Stambh, Kirti Stambh, Padmini Palace and stories of Rajput valour and jauhar. Open roughly sunrise to sunset." },
  { name: "Kumbhalgarh Fort", tag: "Rajsamand", blurb: "A 15th-century fort of Rana Kumbha, with a wall about 36 km long, often described as the second-longest continuous wall after the Great Wall of China. Maharana Pratap was born here. Evening light show in season." },
  { name: "Ranthambore Fort", tag: "Sawai Madhopur", blurb: "A 10th-century fort inside Ranthambore National Park, with ancient temples. Access is usually via the park." },
  { name: "Junagarh Fort", tag: "Bikaner", blurb: "Built from 1589 to 1594 by Raja Rai Singh. Unusual because it sits on flat ground, not a hill, and has well-preserved palaces and a good museum. Ticketed." },
  { name: "City Palace, Udaipur", tag: "Udaipur", blurb: "Begun in 1553 by Maharana Udai Singh II and added to for centuries. A museum complex on Lake Pichola." },
];

const TEMPLES = [
  { name: "Brahma Temple", tag: "Pushkar", blurb: "One of very few temples in India dedicated to Brahma. Free entry. Remove footwear. Open early morning to evening." },
  { name: "Ajmer Sharif Dargah", tag: "Ajmer", blurb: "The shrine of Sufi saint Khwaja Moinuddin Chishti, visited by people of all faiths. Free entry. The annual Urs festival draws huge crowds. Cover your head and dress modestly." },
  { name: "Dilwara Jain Temples", tag: "Mount Abu", blurb: "Marble temples from the 11th-13th centuries, famous for extremely fine carving. Non-Jain visitors are usually allowed from about noon to 6 PM. Cameras and phones are generally not allowed inside." },
  { name: "Ranakpur Jain Temple", tag: "Ranakpur", blurb: "A 15th-century Adinath temple with 1,444 carved marble pillars, no two alike. Visiting hours for non-Jains are limited, around midday to evening. Small fee for cameras or foreigners." },
  { name: "Karni Mata Temple", tag: "Deshnoke", blurb: "Famous as the \"Rat Temple\", where thousands of holy rats (kabbas) are fed and protected. Wear socks. Open from early morning to late evening." },
  { name: "Eklingji Temple", tag: "Near Udaipur", blurb: "A complex of about 100 temples. The main deity is Shiva, the patron deity of the Mewar rulers." },
  { name: "Jagdish Temple", tag: "Udaipur", blurb: "A 17th-century Indo-Aryan temple dedicated to Vishnu, close to City Palace." },
  { name: "Shrinathji Temple", tag: "Nathdwara", blurb: "An important Vaishnav pilgrimage site, also known for Pichwai art. Darshan is in timed slots through the day." },
  { name: "Govind Dev Ji Temple", tag: "Jaipur", blurb: "The royal family's main Krishna temple, in the City Palace complex. Very popular for dawn and evening aarti." },
  { name: "Birla Mandir", tag: "Jaipur", blurb: "A white marble temple on Moti Dungri hill. Free entry, with a clean and calm setting." },
  { name: "Galtaji Temple", tag: "Jaipur", blurb: "A temple complex in an Aravalli gorge with sacred water tanks. Known as the \"Monkey Temple\" because of many monkeys." },
  { name: "Khatu Shyam Ji", tag: "Khatu", blurb: "One of the busiest pilgrimage sites in north India, with big crowds at fairs and weekends." },
  { name: "Salasar Balaji", tag: "Salasar", blurb: "A major Hanuman temple that draws devotees from across the region." },
  { name: "Osian Temples", tag: "Osian", blurb: "A group of early medieval Hindu and Jain temples in the desert, including the Sachiya Mata temple." },
];

const MARKETS = [
  { name: "Johari Bazaar", tag: "Jaipur", blurb: "Jewellery, gems, kundan and meenakari work." },
  { name: "Bapu Bazaar", tag: "Jaipur", blurb: "Textiles, mojari (leather shoes) and lac bangles." },
  { name: "Tripolia Bazaar", tag: "Jaipur", blurb: "Utensils, lac bangles and handicrafts." },
  { name: "Sanganer and Bagru", tag: "Jaipur outskirts", blurb: "Hand block-printed fabrics and printing workshops." },
  { name: "Sardar Market and Ghanta Ghar", tag: "Jodhpur", blurb: "Spices, textiles and handicrafts. Jodhpur is also famous for antiques, lacquer work and furniture." },
  { name: "Hathi Pol and Bada Bazaar", tag: "Udaipur", blurb: "Miniature paintings, silver jewellery, puppets and textiles." },
  { name: "Main Bazaar", tag: "Pushkar", blurb: "Hippie clothing, silver jewellery and leather items. Especially busy during Camel Fair time." },
  { name: "Manak Chowk and Sadar Bazaar", tag: "Jaisalmer", blurb: "Mirror-work textiles, camel-leather goods and embroidery." },
  { name: "Kote Gate and Old City", tag: "Bikaner", blurb: "Bikaneri bhujia, papad, sweets and spices." },
  { name: "Dargah Bazaar and Naya Bazaar", tag: "Ajmer", blurb: "Attar, rosary beads and sweets such as sohan halwa." },
];

const PARKS = [
  { name: "Ranthambore National Park", tag: "Sawai Madhopur", blurb: "Famous for tiger sightings and a fort inside the forest. Safaris run in two shifts, in zones. Book in advance through the official Rajasthan Forest Department booking system. The park is usually closed in the monsoon months (about July-September)." },
  { name: "Keoladeo National Park", tag: "Bharatpur", blurb: "A UNESCO World Heritage wetland (Bharatpur Bird Sanctuary), famous for migratory birds. Best between October and February. Visit by cycle, rickshaw or on foot. Small entry fee." },
  { name: "Sariska Tiger Reserve", tag: "Alwar", blurb: "Aravalli forest reserve with tigers, leopards and the ruins of Kankwari Fort. Safaris by jeep. Usually closed in the monsoon." },
  { name: "Saheliyon-ki-Bari", tag: "Udaipur", blurb: "An 18th-century garden for royal women, with fountains and lotus pools. Small entry fee, open daytime." },
  { name: "Ram Niwas Garden", tag: "Jaipur", blurb: "A large public garden from 1868, with a zoo and bird park, near Albert Hall." },
  { name: "Jawahar Circle Garden", tag: "Jaipur", blurb: "A modern, very large city garden, popular for morning walks and families. Free or low entry." },
  { name: "Mandore Gardens", tag: "Jodhpur", blurb: "The old capital of Marwar, with a garden and royal cenotaphs (chhatris) in red sandstone." },
];

const MUSEUMS = [
  { name: "Albert Hall Museum (Central Museum)", tag: "Jaipur", blurb: "Rajasthan's oldest museum, in a striking Indo-Saracenic building from 1887, in Ram Niwas Garden. Houses carpets, miniatures, metalwork, an Egyptian mummy and ivory work. It is lit up beautifully at night." },
  { name: "Anokhi Museum of Hand Printing", tag: "Amer", blurb: "A restored haveli museum focused on block-printing, with live demonstrations. Usually closed on Mondays." },
  { name: "Jawahar Kala Kendra", tag: "Jaipur", blurb: "An arts and cultural centre designed by architect Charles Correa, with exhibitions, theatre and workshops." },
  { name: "Government Museum (Akbar's Fort)", tag: "Ajmer", blurb: "Built in the 1570s as Akbar's residence. Displays sculptures, weapons and paintings. Typically closed on Fridays." },
  { name: "Umaid Bhawan Palace Museum", tag: "Jodhpur", blurb: "Part of the 20th-century palace, now partly a hotel. Shows vintage cars, clocks, weapons and royal items." },
  { name: "Bagore Ki Haveli", tag: "Udaipur", blurb: "An 18th-century mansion museum on Lake Pichola. Evening traditional dance shows are held." },
  { name: "Ganga Government Museum", tag: "Bikaner", blurb: "Established in 1937, with Harappan and Gupta-era items, paintings and weapons." },
  { name: "Jaisalmer War Museum and Desert Cultural Centre", tag: "Jaisalmer", blurb: "Army-run war museum on the Sam road. The Desert Cultural Centre displays folk instruments and puppets, and holds puppet shows." },
];

const ADVENTURE = [
  { name: "Camel and Jeep Safaris", tag: "Jaisalmer / Bikaner / Pushkar", blurb: "Camel and jeep safaris around Jaisalmer (Sam, Khuhri), Bikaner and Pushkar. From short rides to overnight desert camping." },
  { name: "Hot Air Ballooning", tag: "Jaipur / Pushkar", blurb: "Seasonal in Jaipur (near Amer) and also available in Pushkar. Early-morning flights, usually costly." },
  { name: "Zip-lining at Mehrangarh", tag: "Jodhpur", blurb: "Run by an operator on the fort's walls, with city views." },
  { name: "Wildlife Safaris", tag: "Ranthambore / Sariska / Jawai", blurb: "Safaris in Ranthambore and Sariska. Jawai in Pali district is known for leopards living near granite hills and villages." },
  { name: "Trekking", tag: "Mount Abu / Kumbhalgarh", blurb: "Mount Abu to Guru Shikhar, and Kumbhalgarh-Ranakpur routes in Aravalli forests." },
  { name: "Boating", tag: "Udaipur / Mount Abu", blurb: "Lake Pichola and Fateh Sagar in Udaipur, and Nakki Lake in Mount Abu." },
  { name: "Desert Camps and Cultural Nights", tag: "Sam Sand Dunes", blurb: "Desert camps at Sam Sand Dunes, with folk music and dance." },
  { name: "Cycling and Heritage Walks", tag: "Jaipur / Udaipur / Jodhpur", blurb: "Old City tours in Jaipur, Udaipur and Jodhpur." },
];

const CULTURE = [
  { name: 'Pushkar Camel Fair', tag: 'Oct–Nov', blurb: 'A huge livestock fair and festival around Kartik Purnima.' },
  { name: 'Jaipur Literature Festival', tag: 'Jan', blurb: 'One of the world\'s biggest free literature festivals.' },
  { name: 'Gangaur & Teej', tag: 'Spring / Monsoon', blurb: 'Colourful processions celebrating Parvati, led by women.' },
  { name: 'Ghoomar & Kalbelia', tag: 'Folk dance', blurb: 'Traditional dance forms performed at fairs and desert camps.' },
  { name: 'Kathputli Puppets', tag: 'Folk art', blurb: 'String puppet shows, a Rajasthani tradition.' },
  { name: 'Rajasthani Cuisine', tag: 'Food', blurb: 'Dal baati churma, laal maas, pyaaz kachori and ghewar.' },
];

const DATA = {
  travel: TRAVEL,
  historical: HISTORICAL,
  temples: TEMPLES,
  markets: MARKETS,
  parks: PARKS,
  museums: MUSEUMS,
  adventure: ADVENTURE,
  culture: CULTURE,
};

// every place that has coordinates, for the Distance & Routes map
const ALL_PLACES = Object.entries(DATA)
  .flatMap(([cat, list]) => list.map((p) => ({ ...p, cat, coords: getCoords(p.name, p.tag) })))
  .filter((p) => p.coords);

/* ---------- HOW-TO-USE GUIDE ---------- */
const GUIDE_STEPS = [
  { title: 'Explore', text: 'Scroll through the Explore section. Each category zooms into the next one. Click a category to open its places.' },
  { title: 'Browse places', text: 'In the popup, use the arrows, your keyboard arrow keys or the side list to move between places. Press Esc to close.' },
  { title: 'Plan your route', text: 'In Distance & Routes, pick a start and an end city, then choose how you will travel to see the approximate time.' },
  { title: 'Tell us more', text: 'Missed a place or found a mistake? Send it through Contact.' },
];

/* ---------- PHOTO HELPERS ---------- */
const slug = (s) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const GRADIENTS = [
  'linear-gradient(135deg, #7a3b10, #c97b28)',
  'linear-gradient(135deg, #8a2f2f, #d9623a)',
  'linear-gradient(135deg, #5a3a12, #b8892e)',
  'linear-gradient(135deg, #2f4a5a, #5fa3a8)',
  'linear-gradient(135deg, #4a2f5a, #a85f9a)',
  'linear-gradient(135deg, #3a5a2f, #8fb85f)',
];

// Photo layer first, gradient underneath as a fallback if the photo is missing
const photoBg = (name, i, overlay) =>
  `${overlay}, url("/places/${slug(name)}.jpg"), ${GRADIENTS[i % GRADIENTS.length]}`;

const MAIN_OVERLAY =
  'linear-gradient(to top, rgba(10,6,3,0.88) 0%, rgba(10,6,3,0.3) 55%, rgba(10,6,3,0.1) 100%)';
const THUMB_OVERLAY = 'linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.6))';
const CATEGORY_OVERLAY =
  'linear-gradient(to top, rgba(10,6,3,0.85) 0%, rgba(10,6,3,0.15) 60%, rgba(10,6,3,0.35) 100%)';

const categoryBg = (id, i) => {
  const img = CATEGORIES.find((c) => c.id === id)?.img;
  return `${CATEGORY_OVERLAY}, url("${img}"), ${GRADIENTS[i % GRADIENTS.length]}`;
};

/* ---------- COMPONENTS ---------- */
function PlacesModal({ category, places, index, setIndex, onClose }) {
  const listRef = useRef(null);
  const place = places[index];
  const count = places.length;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex((i) => (i + 1) % count);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex((i) => (i - 1 + count) % count);
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [count, onClose, setIndex]);

  useEffect(() => {
    listRef.current
      ?.querySelector('.place-item.active')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [index]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={category.title}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MAIN CARD (75%) */}
        <div
          className="modal-main"
          key={place.name}
          style={{ backgroundImage: photoBg(place.name, index, MAIN_OVERLAY) }}
        >
          <button className="modal-close glass-circle" onClick={onClose} aria-label="Close">
            ✕
          </button>

          <PlaceMap name={place.name} tag={place.tag} />

          <div className="modal-main-content">
            <span className="card-tag">{place.tag}</span>
            <h2>{place.name}</h2>
            <p>{place.desc ?? place.blurb}</p>

            <div className="modal-nav">
              <button
                className="glass-circle"
                onClick={() => setIndex((index - 1 + count) % count)}
                aria-label="Previous place"
              >
                ←
              </button>
              <button
                className="glass-circle"
                onClick={() => setIndex((index + 1) % count)}
                aria-label="Next place"
              >
                →
              </button>
              <span className="counter">{index + 1} / {count}</span>
            </div>
          </div>
        </div>

        {/* MORE PLACES (20%) */}
        <aside className="modal-list">
          <h4>{category.title}</h4>
          <div className="modal-list-scroll" ref={listRef}>
            {places.map((p, i) => (
              <button
                key={p.name}
                className={`place-item ${i === index ? 'active' : ''}`}
                style={{ backgroundImage: photoBg(p.name, i, THUMB_OVERLAY) }}
                onClick={() => setIndex(i)}
              >
                <span className="name">{p.name}</span>
                <small>{p.tag}</small>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ id, title, intro, children }) {
  return (
    <section id={id} className="section">
      <div className="section-inner">
        <h2>{title}</h2>
        <p className="section-intro">{intro}</p>
        {children}
      </div>
    </section>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [openCat, setOpenCat] = useState(null);
  const [placeIdx, setPlaceIdx] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setMenuOpen(false);

  const openCategory = (id, idx = 0) => {
    setPlaceIdx(idx);
    setOpenCat(id);
    setMenuOpen(false);
  };

  const closeModal = useCallback(() => setOpenCat(null), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    e.target.reset();
  };

  const activeCategory = CATEGORIES.find((c) => c.id === openCat);

  return (
    <div className="app">
      <video className="background-video" autoPlay muted loop playsInline>
        <source src="/rajasthan.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" />

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#home" className="logo" onClick={close}>
          <img src="/logo.png" alt="Rajasthan City Guide Logo" />
        </a>

        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <a href="#home" onClick={close}>Home</a>
          <a href="#guide" onClick={close}>Guide</a>

          <div className="explore-menu">
            <a href="#explore" onClick={close}>Explore ▾</a>
            <div className="dropdown">
              <div className="dropdown-inner">
                {CATEGORIES.map((c) => (
                  <a
                    key={c.id}
                    href="#explore"
                    onClick={(e) => {
                      e.preventDefault();
                      openCategory(c.id);
                    }}
                  >
                    {c.title}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <a href="#routes" onClick={close}>Distance &amp; Routes</a>
          <a href="#contact" onClick={close}>Contact</a>
        </div>
      </nav>

      <header id="home" className="hero">
        <p className="eyebrow">Your Rajasthan city guide</p>
        <h1>Forts, flavours &amp; colour in the Land of Kings</h1>
        <p className="hero-sub">
          Discover palaces, street food, bazaars and quiet gardens across Jaipur,
          Jodhpur, Udaipur, Jaisalmer and beyond.
        </p>
        <div className="hero-actions">
          <a
            href="#explore"
            className={`glass-btn ${activeAction === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveAction('explore')}
          >
            Explore Places
          </a>
          <a
            href="#routes"
            className={`glass-btn ${activeAction === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveAction('plan')}
          >
            Plan Your Trip
          </a>
        </div>
      </header>

      <main>
        {/* ---------- HOW TO USE THIS GUIDE ---------- */}
        <Section id="guide" title="How to use this guide" intro="Four quick steps to get the most out of the site.">
          <ol className="guide-steps">
            {GUIDE_STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="guide-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* ---------- SCROLL-DRIVEN EXPLORE (renders its own <section id="explore">) ---------- */}
        <ZoomExplore
          categories={CATEGORIES}
          data={DATA}
          onOpen={openCategory}
          bgFor={categoryBg}
        />

        <Section id="routes" title="Distance & Routes" intro="Pick two cities to see them on the map, with the approximate distance and travel time.">
          <RouteExplorer places={ALL_PLACES} categories={CATEGORIES} />
        </Section>

        <Section id="contact" title="Contact" intro="Suggestions, corrections or a place we missed? Tell us.">
          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Your name" required />
            <input type="email" name="email" placeholder="Email" required />
            <textarea name="message" rows="4" placeholder="Your message" required />
            <button type="submit" className="btn primary">Send message</button>
            {sent && <p className="thanks">Thanks! Your message has been noted.</p>}
          </form>
        </Section>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Rajasthan City Guide
      </footer>

      {activeCategory && (
        <PlacesModal
          category={activeCategory}
          places={DATA[activeCategory.id]}
          index={placeIdx}
          setIndex={setPlaceIdx}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default App;