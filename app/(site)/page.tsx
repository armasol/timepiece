import { Nav } from '@/components/Nav';
import { HomeExperience } from '@/components/HomeExperience';
import { Footer } from '@/components/Footer';

export default function Home(){
  return <main className="page"><Nav/><HomeExperience/><Footer/></main>;
}
