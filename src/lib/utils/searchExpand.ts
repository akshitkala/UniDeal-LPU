/**
 * lib/utils/searchExpand.ts
 * Provides synonym expansion for campus marketplace searches.
 */

const synonymMap: Record<string, string[]> = {
  // Common campus item synonyms
  'laptop':    ['laptop', 'notebook', 'macbook', 'chromebook'],
  'phone':     ['phone', 'mobile', 'smartphone', 'iphone', 'android'],
  'book':      ['book', 'textbook', 'notes', 'novel', 'guide'],
  'cycle':     ['cycle', 'bicycle', 'bike'],
  'chair':     ['chair', 'seat', 'stool'],
  'table':     ['table', 'desk', 'study table'],
  'fan':       ['fan', 'cooler'],
  'charger':   ['charger', 'adapter', 'wire', 'cable'],
  'bag':       ['bag', 'backpack', 'rucksack', 'purse'],
  'shoes':     ['shoes', 'sneakers', 'boots', 'footwear', 'sandals'],
  'clothes':   ['clothes', 'shirt', 'jeans', 'jacket', 'hoodie'],
  'guitar':    ['guitar', 'instrument', 'acoustic', 'bass'],
  'dumbbell':  ['dumbbell', 'weights', 'gym', 'barbell'],
  'mattress':  ['mattress', 'bed', 'pillow'],
  'lamp':      ['lamp', 'light', 'bulb'],
};

export function expandQuery(q: string): string {
  if (!q) return q;
  const lower = q.toLowerCase().trim();
  const synonyms = synonymMap[lower];
  if (synonyms) return synonyms.join(' ');  // MongoDB $text searches all terms with OR
  return q;
}
