import { pool } from '../config/database.js';
import { initializeDatabase } from '../config/database.js';

// Sample data based on the frontend's initial state
const seedData = {
  tiers: [
    {
      tier_id: 'tier-a',
      name: 'A',
      color: 'bg-blue-200',
      position: 0
    },
    {
      tier_id: 'tier-b',
      name: 'B',
      color: 'bg-blue-200',
      position: 1
    },
    {
      tier_id: 'tier-c',
      name: 'C',
      color: 'bg-blue-200',
      position: 2
    },
    {
      tier_id: 'tier-d',
      name: 'D',
      color: 'bg-yellow-200',
      position: 3
    },
    {
      tier_id: 'tier-e',
      name: 'E',
      color: 'bg-purple-200',
      position: 4
    }
  ],
  sourceCards: [
    // Competitors
    {
      card_id: 'source-comp-1',
      text: 'Google Google',
      type: 'competitor',
      subtype: 'image',
      source_category: 'competitors',
      image_url: 'https://img.logo.dev/google.com?token=pk_X-1ZO13ESamOoEeKeLUTVA&format=png&size=200'
    },
    {
      card_id: 'source-comp-2',
      text: 'Meta',
      type: 'competitor',
      subtype: 'text',
      source_category: 'competitors',
      image_url: null
    },
    {
      card_id: 'source-comp-3',
      text: 'Apple Apple',
      type: 'competitor',
      subtype: 'image',
      source_category: 'competitors',
      image_url: 'https://img.logo.dev/apple.com?token=pk_X-1ZO13ESamOoEeKeLUTVA&format=png&size=200'
    },
    // Pages
    {
      card_id: 'source-page-1',
      text: 'Homepage',
      type: 'page',
      source_category: 'pages',
      image_url: null
    },
    {
      card_id: 'source-page-2',
      text: 'About Us',
      type: 'page',
      source_category: 'pages',
      image_url: null
    },
    // Personas
    {
      card_id: 'source-persona-1',
      text: 'Adam',
      type: 'personas',
      source_category: 'personas',
      image_url: null
    },
    {
      card_id: 'source-persona-2',
      text: 'Sara',
      type: 'personas',
      source_category: 'personas',
      image_url: null
    }
  ],
  cards: [
    // Sample cards in tiers
    {
      card_id: 'card-sample-1',
      text: 'Sample Card 1',
      type: 'text',
      subtype: 'text',
      image_url: null,
      hidden: false,
      tier_id: 'tier-a',
      position: 0
    },
    {
      card_id: 'card-sample-2',
      text: 'Sample Card 2',
      type: 'image',
      subtype: 'image',
      image_url: 'https://img.logo.dev/example.com?token=pk_X-1ZO13ESamOoEeKeLUTVA&format=png&size=200',
      hidden: false,
      tier_id: 'tier-b',
      position: 0
    }
  ],
  comments: [
    {
      comment_id: 'comment-1',
      text: 'This is a sample comment',
      card_id: 'card-sample-1'
    },
    {
      comment_id: 'comment-2',
      text: 'Another sample comment',
      card_id: 'card-sample-2'
    }
  ]
};

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Initialize database tables
    await initializeDatabase();
    
    // Clear existing data
    await client.query('DELETE FROM comments');
    await client.query('DELETE FROM cards');
    await client.query('DELETE FROM source_cards');
    await client.query('DELETE FROM versions');
    await client.query('DELETE FROM tiers');
    
    console.log('🧹 Cleared existing data');
    
    // Insert tiers
    for (const tier of seedData.tiers) {
      await client.query(
        'INSERT INTO tiers (tier_id, name, color, position) VALUES ($1, $2, $3, $4)',
        [tier.tier_id, tier.name, tier.color, tier.position]
      );
    }
    console.log(`✅ Inserted ${seedData.tiers.length} tiers`);
    
    // Insert source cards
    for (const sourceCard of seedData.sourceCards) {
      await client.query(
        'INSERT INTO source_cards (card_id, text, type, subtype, source_category, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
        [sourceCard.card_id, sourceCard.text, sourceCard.type, sourceCard.subtype, sourceCard.source_category, sourceCard.image_url]
      );
    }
    console.log(`✅ Inserted ${seedData.sourceCards.length} source cards`);
    
    // Insert cards
    for (const card of seedData.cards) {
      await client.query(
        'INSERT INTO cards (card_id, text, type, subtype, image_url, hidden, tier_id, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [card.card_id, card.text, card.type, card.subtype, card.image_url, card.hidden, card.tier_id, card.position]
      );
    }
    console.log(`✅ Inserted ${seedData.cards.length} cards`);
    
    // Insert comments
    for (const comment of seedData.comments) {
      await client.query(
        'INSERT INTO comments (comment_id, text, card_id) VALUES ($1, $2, $3)',
        [comment.comment_id, comment.text, comment.card_id]
      );
    }
    console.log(`✅ Inserted ${seedData.comments.length} comments`);
    
    // Create initial version
    const tiers = await client.query('SELECT * FROM tiers ORDER BY position');
    const sourceCards = await client.query('SELECT * FROM source_cards ORDER BY source_category, created_at');
    const cards = await client.query('SELECT * FROM cards ORDER BY tier_id, position');
    const comments = await client.query('SELECT * FROM comments ORDER BY card_id, created_at');
    
    // Group source cards by category
    const sourceCardsGrouped = {};
    sourceCards.rows.forEach(card => {
      if (!sourceCardsGrouped[card.source_category]) {
        sourceCardsGrouped[card.source_category] = [];
      }
      sourceCardsGrouped[card.source_category].push({
        id: card.card_id,
        text: card.text,
        type: card.type,
        subtype: card.subtype,
        sourceCategory: card.source_category,
        imageUrl: card.image_url
      });
    });
    
    // Group cards by tier
    const tiersWithCards = tiers.rows.map(tier => ({
      id: tier.tier_id,
      name: tier.name,
      color: tier.color,
      position: tier.position,
      cards: cards.rows
        .filter(card => card.tier_id === tier.tier_id)
        .map(card => {
          const cardComments = comments.rows
            .filter(comment => comment.card_id === card.card_id)
            .map(comment => ({
              id: comment.comment_id,
              text: comment.text,
              createdAt: comment.created_at
            }));
          
          return {
            id: card.card_id,
            text: card.text,
            type: card.type,
            subtype: card.subtype,
            imageUrl: card.image_url,
            hidden: card.hidden,
            position: card.position,
            comments: cardComments
          };
        })
    }));
    
    // Create initial version
    await client.query(
      'INSERT INTO versions (version_id, description, tiers_data, source_cards_data) VALUES ($1, $2, $3, $4)',
      [
        `version-${Date.now()}`,
        'Initial seed data',
        JSON.stringify(tiersWithCards),
        JSON.stringify(sourceCardsGrouped)
      ]
    );
    console.log('✅ Created initial version');
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase }; 