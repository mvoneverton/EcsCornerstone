export interface WSAQuestion {
  id:   number;
  text: string;
}

// 32 questions reframed for relational / family context.
// Scale: 1 = Rarely/Never  →  5 = Almost Always
export const wsaQuestions: WSAQuestion[] = [
  { id:  1, text: 'I take the lead in making decisions for our relationship or family.' },
  { id:  2, text: 'I express my feelings and emotions openly with those close to me.' },
  { id:  3, text: 'I prefer to plan activities and gatherings well in advance.' },
  { id:  4, text: 'I enjoy spending time connecting socially with friends and extended family.' },
  { id:  5, text: 'I push for resolution quickly when there is tension or conflict.' },
  { id:  6, text: 'I prioritize keeping peace and harmony in my relationships.' },
  { id:  7, text: 'I bring energy and enthusiasm to conversations and shared activities.' },
  { id:  8, text: 'I follow through on commitments I make to loved ones.' },
  { id:  9, text: 'I am direct and straightforward when sharing my needs or concerns.' },
  { id: 10, text: 'I tune in to the emotional needs of people I care about.' },
  { id: 11, text: 'I prefer a consistent routine at home over spontaneous changes.' },
  { id: 12, text: 'I enjoy being the center of attention in family or group settings.' },
  { id: 13, text: 'I challenge others\' ideas or plans when I believe there is a better way.' },
  { id: 14, text: 'I go out of my way to make others feel comfortable and valued.' },
  { id: 15, text: 'I think through decisions carefully before acting on them.' },
  { id: 16, text: 'I inspire others with my optimism and excitement about the future.' },
  { id: 17, text: 'I stand firm in my position even when others disagree with me.' },
  { id: 18, text: 'I adapt my communication style to make others feel understood.' },
  { id: 19, text: 'I keep things organized and structured in shared living or activities.' },
  { id: 20, text: 'I initiate new experiences and adventures for our relationship or family.' },
  { id: 21, text: 'I set clear boundaries about what I will and will not accept.' },
  { id: 22, text: 'I offer encouragement and emotional support freely to those I love.' },
  { id: 23, text: 'I analyze situations carefully before offering an opinion or solution.' },
  { id: 24, text: 'I bring joy and lightheartedness to everyday moments at home.' },
  { id: 25, text: 'I take charge in stressful or uncertain situations.' },
  { id: 26, text: 'I prioritize deep, meaningful conversations over small talk.' },
  { id: 27, text: 'I prefer to think things through alone before discussing them.' },
  { id: 28, text: 'I keep the energy lively and fun during family or social gatherings.' },
  { id: 29, text: 'I am comfortable confronting issues directly rather than letting them build.' },
  { id: 30, text: 'I show affection and warmth consistently in my relationships.' },
  { id: 31, text: 'I rely on facts and logic when solving problems in my relationships.' },
  { id: 32, text: 'I create an environment where others feel safe expressing themselves.' },
];
