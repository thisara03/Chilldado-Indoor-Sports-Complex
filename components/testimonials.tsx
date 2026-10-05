'use client';
import {useState} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {TestimonialsColumn,type Testimonial} from './ui/testimonials-columns-1';
const previews:Testimonial[]=[
{text:'A covered arena for your next friendly match, whatever the weather.',name:'Match-day crew',role:'Preview card · not a customer review'},
{text:'Choose a two-hour session and get the team together in Kottawa.',name:'Team organiser',role:'Preview card · not a customer review'},
{text:'Explore slots around the clock and plan a game that suits your crew.',name:'Evening players',role:'Preview card · not a customer review'},
{text:'A space for focused practice, friendly competition and time with your team.',name:'Practice squad',role:'Preview card · not a customer review'},
{text:'From the first delivery to the last over, make room for your next game.',name:'Cricket community',role:'Preview card · not a customer review'},
{text:'Bring your supporters along to the planned spectator pavilion.',name:'Friends and family',role:'Preview card · not a customer review'},
{text:'Plan your session with clear two-hour slots and an upfront price.',name:'Weekend team',role:'Preview card · not a customer review'},
{text:'Make cricket part of your next get-together with friends or colleagues.',name:'Group organiser',role:'Preview card · not a customer review'},
{text:'Your game. Your crew. Your arena. Discover the Chillado experience.',name:'Chillado community',role:'Preview card · not a customer review'}];
export default function Testimonials(){const [paused,setPaused]=useState(false);const reduced=useReducedMotion();return <section className="section testimonials-section" aria-labelledby="testimonials-heading"><motion.div className="testimonials-heading" initial={reduced?false:{opacity:0,y:20}} whileInView={{opacity:1,y:0}} transition={{duration:.6}} viewport={{once:true}}><p className="eyebrow">THE CHILLADO COMMUNITY</p><h2 id="testimonials-heading">Your stories.<br/><em>Our arena.</em></h2><p className="muted">Real customer stories will appear here. These preview cards show the planned Chillado experience.</p>{!reduced&&<button type="button" className="outline-button" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?'Resume animation':'Pause animation'}</button>}</motion.div><div className={`testimonial-columns${reduced?' static-reviews':''}`}><TestimonialsColumn testimonials={previews.slice(0,3)} duration={15} paused={paused}/><TestimonialsColumn testimonials={previews.slice(3,6)} className="review-tablet" duration={19} paused={paused}/><TestimonialsColumn testimonials={previews.slice(6,9)} className="review-desktop" duration={17} paused={paused}/></div></section>}
