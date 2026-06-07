const db = require('../db');
const _ = require('lodash');

class KnowledgeGraph {
  extractEntities(content) {
    if (!content) return [];
    
    const patterns = [
      { type: 'brand', regex: /[\u4e00-\u9fa5]{2,8}(?:集团|股份|科技|有限公司|公司)/g },
      { type: 'person', regex: /[\u4e00-\u9fa5]{2,4}(?:先生|女士|博士|教授)/g },
      { type: 'location', regex: /[\u4e00-\u9fa5]{2,10}(?:省|市|区|县)/g },
      { type: 'product', regex: /[\u4e00-\u9fa5]{2,6}(?:手机|电脑|汽车|冰箱|洗衣机|空调)/g }
    ];

    const entities = [];
    patterns.forEach(pattern => {
      const matches = content.match(pattern.regex) || [];
      matches.forEach(match => {
        entities.push({
          name: match,
          type: pattern.type,
          confidence: 0.85
        });
      });
    });

    return _.uniqBy(entities, e => e.name + e.type);
  }

  extractRelations(entities, content) {
    const relations = [];
    const relationTypes = [
      { pattern: /(?:投资|控股|收购)/, type: 'invest' },
      { pattern: /(?:合作|合资|战略伙伴)/, type: 'cooperate' },
      { pattern: /(?:推出|发布|生产|制造)/, type: 'produce' },
      { pattern: /(?:位于|坐落于|总部)/, type: 'located_in' },
      { pattern: /(?:创始人|CEO|董事长)/, type: 'founder_of' }
    ];

    for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < entities.length; j++) {
        if (i === j) continue;
        const segment = content.substring(
          Math.max(0, content.indexOf(entities[i].name) - 30),
          Math.min(content.length, content.indexOf(entities[j].name) + 30)
        );

        for (const rt of relationTypes) {
          if (rt.pattern.test(segment)) {
            relations.push({
              source: entities[i].name,
              target: entities[j].name,
              type: rt.type,
              confidence: 0.75
            });
            break;
          }
        }
      }
    }

    return relations;
  }

  buildTopicGraph(topicId) {
    const topic = db.prepare('SELECT * FROM knowledge_topics WHERE id = ?').get(topicId);
    if (!topic) throw new Error('Topic not found');

    const entities = this.extractEntities(topic.content || topic.summary || '');
    
    db.prepare('DELETE FROM knowledge_entities WHERE topic_id = ?').run(topicId);
    
    const entityIds = {};
    const insertEntity = db.prepare('INSERT INTO knowledge_entities (topic_id, entity_name, entity_type, confidence) VALUES (?, ?, ?, ?)');
    
    entities.forEach(e => {
      const info = insertEntity.run(topicId, e.name, e.type, e.confidence);
      entityIds[e.name] = info.lastInsertRowid;
    });

    const relations = this.extractRelations(entities, topic.content || topic.summary || '');
    const insertRelation = db.prepare('INSERT INTO knowledge_relations (source_entity_id, target_entity_id, relation_type, confidence) VALUES (?, ?, ?, ?)');
    
    relations.forEach(r => {
      if (entityIds[r.source] && entityIds[r.target]) {
        insertRelation.run(entityIds[r.source], entityIds[r.target], r.type, r.confidence);
      }
    });

    return { entities, relations };
  }

  getGraphData(topicId = null) {
    let query = `
      SELECT ke.id, ke.entity_name as name, ke.entity_type as type, ke.confidence
      FROM knowledge_entities ke
    `;
    const params = [];
    if (topicId) {
      query += ' WHERE ke.topic_id = ?';
      params.push(topicId);
    }
    
    const nodes = db.prepare(query).all(...params);
    
    const relQuery = `
      SELECT kr.id, 
             se.entity_name as source, 
             te.entity_name as target, 
             kr.relation_type as type,
             kr.confidence
      FROM knowledge_relations kr
      JOIN knowledge_entities se ON kr.source_entity_id = se.id
      JOIN knowledge_entities te ON kr.target_entity_id = te.id
      ${topicId ? ' WHERE se.topic_id = ?' : ''}
    `;
    
    const edges = db.prepare(relQuery).all(...(topicId ? [topicId] : []));

    return { nodes, edges };
  }

  getConceptHierarchy(parentId = null) {
    const query = parentId 
      ? 'SELECT * FROM concept_hierarchy WHERE parent_id = ? ORDER BY level, name'
      : 'SELECT * FROM concept_hierarchy WHERE parent_id IS NULL ORDER BY level, name';
    
    const items = db.prepare(query).all(...(parentId ? [parentId] : []));
    
    return items.map(item => ({
      ...item,
      children: this.getConceptHierarchy(item.id)
    }));
  }
}

module.exports = new KnowledgeGraph();
