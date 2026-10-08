import { Booking, Pet, Sitter } from './types';

// The sitter account used when the app is switched to "sitter" mode.
export const ME_SITTER_ID = 's1';

export const sitters: Sitter[] = [
  {
    id: 's1', name: 'Maria Ionescu', avatar: '👩🏻', city: 'Bucharest', neighborhood: 'Floreasca',
    rating: 4.9, reviews: 128, price: 120, years: 6, verified: true, available: true,
    services: ['boarding', 'house', 'dropin'], accepts: ['dog', 'cat', 'small'],
    bio: 'Vet nurse by day and lifelong animal lover. I have a fenced garden and a calm senior beagle who loves company.',
    reviewList: [
      { author: 'Andrei', stars: 5, text: 'Sent photos every evening. Our cat did not even notice we were gone.' },
      { author: 'Elena', stars: 5, text: 'Handled our dog\'s medication perfectly.' },
    ],
  },
  {
    id: 's2', name: 'Radu Popescu', avatar: '🧔🏻', city: 'Bucharest', neighborhood: 'Herăstrău',
    rating: 4.8, reviews: 74, price: 60, years: 4, verified: true, available: true,
    services: ['walking', 'dropin'], accepts: ['dog'],
    bio: 'Marathon runner, so your energetic dog will get the long walks they deserve. Park is two minutes away.',
    reviewList: [{ author: 'Ioana', stars: 5, text: 'Our husky finally comes home tired!' }],
  },
  {
    id: 's3', name: 'Sofia Marin', avatar: '👩🏽', city: 'Cluj-Napoca', neighborhood: 'Grigorescu',
    rating: 5.0, reviews: 41, price: 100, years: 3, verified: true, available: true,
    services: ['house', 'dropin'], accepts: ['cat', 'bird', 'small'],
    bio: 'Quiet home, no other pets. Experienced with shy cats, parrots and rabbits.',
    reviewList: [{ author: 'Mihai', stars: 5, text: 'Our parrot learned a new word while we were away.' }],
  },
  {
    id: 's4', name: 'Vlad Georgescu', avatar: '👨🏼', city: 'Bucharest', neighborhood: 'Drumul Taberei',
    rating: 4.6, reviews: 22, price: 90, years: 2, verified: false, available: true,
    services: ['boarding', 'walking'], accepts: ['dog', 'cat'],
    bio: 'Student working from home with plenty of time for play. Big apartment and lots of toys.',
    reviewList: [{ author: 'Cristina', stars: 4, text: 'Friendly and reliable, would book again.' }],
  },
  {
    id: 's5', name: 'Ana Dumitru', avatar: '👩🏼‍🦰', city: 'Timișoara', neighborhood: 'Complex Studențesc',
    rating: 4.9, reviews: 96, price: 110, years: 8, verified: true, available: false,
    services: ['boarding', 'house', 'dropin', 'walking'], accepts: ['dog', 'cat', 'bird', 'small'],
    bio: 'Certified pet first aid. I treat every guest like family and keep a daily diary for you.',
    reviewList: [{ author: 'Bogdan', stars: 5, text: 'Best sitter we have ever had.' }],
  },
  {
    id: 's6', name: 'Tudor Stan', avatar: '👨🏽', city: 'Cluj-Napoca', neighborhood: 'Mărăști',
    rating: 4.7, reviews: 35, price: 80, years: 5, verified: true, available: true,
    services: ['boarding', 'walking'], accepts: ['dog'],
    bio: 'Former dog trainer. Good with reactive dogs and puppies still learning the basics.',
    reviewList: [{ author: 'Raluca', stars: 5, text: 'He even helped with our puppy\'s leash pulling.' }],
  },
];

export const initialPets: Pet[] = [
  { id: 'p1', name: 'Bruno', type: 'dog', breed: 'Labrador', age: 4, notes: 'Two walks a day, loves tennis balls.' },
  { id: 'p2', name: 'Miți', type: 'cat', breed: 'European shorthair', age: 7, notes: 'Shy at first. Wet food twice a day.' },
];

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

// Requests from other owners so sitter mode has something to show.
export const initialBookings: Booking[] = [
  {
    id: 'b1', sitterId: ME_SITTER_ID, ownerName: 'Elena V.', pets: [{ name: 'Luna', type: 'cat' }],
    service: 'house', start: day(5), nights: 4, note: 'Luna needs her thyroid pill with breakfast.',
    total: 480, status: 'pending', createdAt: Date.now() - 3600_000,
  },
  {
    id: 'b2', sitterId: ME_SITTER_ID, ownerName: 'George P.', pets: [{ name: 'Rex', type: 'dog' }, { name: 'Bella', type: 'dog' }],
    service: 'boarding', start: day(12), nights: 2, note: 'They are used to sleeping in the same crate.',
    total: 240, status: 'accepted', createdAt: Date.now() - 86_400_000,
  },
];
