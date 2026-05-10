import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { Services } from './components/Services';
import { Marketplaces } from './components/Marketplaces';
import { BeforeAfter } from './components/BeforeAfter';
import { Process } from './components/Process';
import { Trust } from './components/Trust';
import { BookingForm } from './components/BookingForm';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Services />
        <Marketplaces />
        <BeforeAfter />
        <Process />
        <Trust />
        <BookingForm />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default App;
