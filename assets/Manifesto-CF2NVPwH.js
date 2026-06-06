import{i as e,n as t,t as n}from"./jsx-runtime-bzQ4Vb5N.js";import{c as r,o as i}from"./index-4a_tLube.js";var a=e(t(),1),o={container:`_container_ggkf1_1`,sidebar:`_sidebar_ggkf1_10`,sideItem:`_sideItem_ggkf1_22`,sideItemActive:`_sideItemActive_ggkf1_44`,sideSymbol:`_sideSymbol_ggkf1_48`,sideName:`_sideName_ggkf1_53`,content:`_content_ggkf1_61`,header:`_header_ggkf1_70`,headerSymbol:`_headerSymbol_ggkf1_76`,headerName:`_headerName_ggkf1_81`,divider:`_divider_ggkf1_88`,body:`_body_ggkf1_94`},s=n(),c={dauntless:`We believe that cowardice is to blame for the world's failure.

Cowardice is what allows injustice to fester. Cowardice is what drives people to look away from what is true, from what is right. It is what keeps a person silent when they should speak, still when they should move, comfortable when they should be afraid.

We have chosen to face our fears and conquer them — not because it feels good, but because it is necessary. Without courage, knowledge is useless. Without courage, kindness is hollow. Without courage, honesty becomes silence.

We are the ones who will not look away. We will not hesitate. We will stand between the innocent and those who would harm them, and we will not yield.

Cowardice is a choice. So is bravery. We have made ours.`,erudite:`The pursuit of knowledge is the highest calling of the human mind.

Ignorance is not merely a lack of information. It is the root of every war ever fought, every injustice ever committed, every preventable mistake ever made. When people do not understand the world, they fear it. When they fear it, they destroy it.

We dedicate our lives to the elimination of ignorance in all its forms. Through study, through inquiry, through the relentless application of reason, we construct a world that actually works. We do not act on feeling. We act on fact. We do not trust instinct when evidence is available.

Knowledge is not power. Knowledge is the prerequisite for every power worth having. The one who understands the world will always outlast the one who only knows how to fight it.`,amity:`We believe that conflict — all conflict — is a choice.

We choose peace. We choose to see the humanity in those who oppose us, to extend grace before judgment, to build rather than destroy. We work the land because the earth does not lie, does not fight, does not take. It gives, season after season, to anyone patient enough to tend it.

We are not weak. We are not naive. We have simply decided that the world is worth saving — and that it can only be saved with open hands, not closed fists.

Every war in history began with someone deciding that their grievance was more important than another person's life. We refuse that calculation. We will find another way. We always have.

The fruit of peace is a longer harvest than the fruit of war.`,abnegation:`The self is the enemy.

The self is the origin of every war, every theft, every act of cruelty. When a person acts for themselves — for their own comfort, their own gain, their own pride — they take from the world rather than give to it. They consume. They diminish. They leave things worse than they found them.

We choose to give. We choose to serve. We choose to be invisible so that others may be seen, to be hungry so that others may eat, to step aside so that others may pass.

The highest virtue is not what you accomplish for yourself, but what you sacrifice for others. A life spent in service to others is not a life diminished. It is the only life that matters.

We ask for nothing. We expect nothing. What we receive is beside the point.`,candor:`Lies are the foundation of every atrocity.

Every war begins with a lie. Every injustice is sustained by silence. Every cruelty is made possible by the comfortable omissions and careful half-truths that polite society calls tact.

We are done with lies. We will say what we see. We will name what we know. We will not smile and say nothing when the truth is sitting plainly in the room.

Honesty is not cruelty. Cruelty is what happens when the truth is hidden long enough to fester into something no one can face anymore. We speak early, while the wound is still clean. We speak clearly, while the facts are still available.

The world does not need more diplomacy. It needs more people willing to say the thing that everyone already knows but no one will admit. We are those people. We will not pretend otherwise.`,divergent:`There are those who do not fit.

Those who walk into a room of carefully sorted people and feel the pull of every faction at once — the hunger for knowledge, the call to courage, the ache to serve, the need for peace, the demand for truth. The system looks at them and sees a malfunction. A mistake to be corrected.

We call it freedom.

We are not the exception to the system. We are the proof that the system was always wrong. You cannot reduce a human soul to a single word. You cannot bottle a person into a single virtue and call what remains a human being. Something is always lost. Something essential.

The factions are not wrong about what they value. Courage matters. Knowledge matters. Peace and selflessness and honesty all matter. The error is in the insistence that each person can only hold one.

We hold all of them. Imperfectly, incompletely, sometimes in contradiction — but we hold them.

They call us dangerous. They are correct.`};function l(){let e=i(e=>e.factionId),[t,n]=(0,a.useState)(e===`divergent`?`divergent`:e),l=r.find(e=>e.id===t);return(0,s.jsxs)(`div`,{className:o.container,children:[(0,s.jsx)(`div`,{className:o.sidebar,children:r.map(e=>(0,s.jsxs)(`button`,{className:`${o.sideItem} ${e.id===t?o.sideItemActive:``}`,style:e.id===t?{borderLeftColor:e.color,color:e.color}:void 0,onClick:()=>n(e.id),children:[(0,s.jsx)(`span`,{className:o.sideSymbol,children:e.symbol}),(0,s.jsx)(`span`,{className:o.sideName,children:e.name})]},e.id))}),(0,s.jsxs)(`div`,{className:o.content,children:[(0,s.jsxs)(`div`,{className:o.header,children:[(0,s.jsx)(`span`,{className:o.headerSymbol,children:l.symbol}),(0,s.jsx)(`h2`,{className:o.headerName,style:{color:l.color},children:l.name.toUpperCase()})]}),(0,s.jsx)(`div`,{className:o.divider,style:{background:l.color}}),(0,s.jsx)(`p`,{className:o.body,children:c[t]})]})]})}export{l as ManifestoApp};