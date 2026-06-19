"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildKnowledgeGraph = buildKnowledgeGraph;
exports.searchKnowledgeGraph = searchKnowledgeGraph;
exports.generateQAMatches = generateQAMatches;
exports.matchPoliciesToProfile = matchPoliciesToProfile;
function buildKnowledgeGraph(policies) {
    const graph = new Map();
    for (const policy of policies) {
        const policyData = policy;
        const graphNodes = Array.isArray(policy.graphNodes) ? policy.graphNodes : [];
        const relatedPolicyIds = Array.isArray(policy.relatedPolicies)
            ? policy.relatedPolicies
            : Array.isArray(policyData.relatedPolicyIds)
                ? policyData.relatedPolicyIds
                : [];
        const relatedServiceIds = Array.isArray(policy.relatedServices)
            ? policy.relatedServices
            : Array.isArray(policyData.relatedServiceIds)
                ? policyData.relatedServiceIds
                : [];
        const policyNode = {
            id: `policy-${policy.id}`,
            type: 'policy',
            title: policy.title,
            content: policy.summary || policy.content.substring(0, 200),
            relations: [],
            metadata: {
                category: policy.category,
                department: policy.issuingDepartment || policyData.departmentName || policyData.departmentCode,
                effectiveDate: policy.effectiveDate
            }
        };
        if (graphNodes.length > 0) {
            for (const node of graphNodes) {
                policyNode.relations.push({
                    targetId: node.id,
                    targetType: node.type,
                    relationType: 'contains',
                    description: '包含条款'
                });
                node.relations.push({
                    targetId: policyNode.id,
                    targetType: 'policy',
                    relationType: 'belongs_to',
                    description: '所属政策'
                });
                graph.set(node.id, node);
            }
        }
        for (const relatedPolicyId of relatedPolicyIds) {
            policyNode.relations.push({
                targetId: `policy-${relatedPolicyId}`,
                targetType: 'policy',
                relationType: 'related',
                description: '相关政策'
            });
        }
        for (const relatedServiceId of relatedServiceIds) {
            policyNode.relations.push({
                targetId: `service-${relatedServiceId}`,
                targetType: 'service',
                relationType: 'reference',
                description: '关联办事'
            });
        }
        graph.set(policyNode.id, policyNode);
    }
    return graph;
}
function searchKnowledgeGraph(graph, query, userProfile, limit = 10) {
    const keywords = extractKeywords(query);
    const results = [];
    for (const node of graph.values()) {
        const score = calculateNodeRelevance(node, keywords, query, userProfile);
        if (score > 0.1) {
            const relatedNodes = getRelatedNodes(graph, node, 2);
            results.push({
                node,
                score,
                relatedNodes,
                path: [node.id, ...relatedNodes.map(n => n.id)]
            });
        }
    }
    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
function calculateNodeRelevance(node, keywords, rawQuery, profile) {
    let score = 0;
    const searchText = `${node.title} ${node.content}`.toLowerCase();
    const lowerQuery = rawQuery.toLowerCase();
    if (node.title.toLowerCase().includes(lowerQuery)) {
        score += 0.5;
    }
    for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
            score += 0.3;
        }
    }
    if (node.type === 'faq' && lowerQuery.length > 2) {
        const simScore = stringSimilarity(lowerQuery, node.title.toLowerCase());
        score += simScore * 0.4;
    }
    if (profile && node.metadata) {
        const profileTags = profile.tags.map(t => t.name);
        for (const tag of profileTags) {
            if (searchText.includes(tag.toLowerCase())) {
                score += 0.15;
            }
        }
    }
    if (node.type === 'policy') {
        score += 0.1;
    }
    return Math.min(score, 1.0);
}
function extractKeywords(query) {
    const stopWords = ['的', '了', '和', '是', '在', '我', '有', '要', '可以', '怎么', '如何', '什么', '吗', '呢', '啊', '请'];
    const cleaned = query.replace(/[，。！？、；：""''（）【】《》.,!?;:\'\"()\[\]<>]/g, ' ');
    let words = cleaned.split(/\s+/).filter(w => w.length >= 2);
    const ngrams = [];
    for (const word of words) {
        for (let n = 2; n <= Math.min(word.length, 4); n++) {
            for (let i = 0; i <= word.length - n; i++) {
                ngrams.push(word.substring(i, i + n));
            }
        }
    }
    return [...words, ...ngrams].filter(w => !stopWords.includes(w));
}
function getRelatedNodes(graph, startNode, depth) {
    const visited = new Set();
    const result = [];
    let currentLevel = [startNode];
    for (let d = 0; d < depth; d++) {
        const nextLevel = [];
        for (const node of currentLevel) {
            for (const rel of node.relations) {
                if (!visited.has(rel.targetId)) {
                    visited.add(rel.targetId);
                    const targetNode = graph.get(rel.targetId);
                    if (targetNode) {
                        result.push(targetNode);
                        nextLevel.push(targetNode);
                    }
                }
            }
        }
        currentLevel = nextLevel;
    }
    return result;
}
function stringSimilarity(s1, s2) {
    const longer = s1.length >= s2.length ? s1 : s2;
    const shorter = s1.length >= s2.length ? s2 : s1;
    if (longer.length === 0)
        return 1.0;
    const costs = [];
    for (let i = 0; i <= shorter.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= longer.length; j++) {
            if (i === 0) {
                costs[j] = j;
            }
            else if (j > 0) {
                let newValue = costs[j - 1];
                if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0)
            costs[longer.length] = lastValue;
    }
    return (longer.length - costs[longer.length]) / longer.length;
}
function generateQAMatches(qaPairs, query, threshold = 0.5) {
    const keywords = extractKeywords(query);
    const lowerQuery = query.toLowerCase();
    const scored = qaPairs.map(qa => {
        let score = stringSimilarity(lowerQuery, qa.question.toLowerCase());
        for (const keyword of keywords) {
            if (qa.question.toLowerCase().includes(keyword.toLowerCase())) {
                score += 0.15;
            }
            if (qa.answer.toLowerCase().includes(keyword.toLowerCase())) {
                score += 0.08;
            }
            if (qa.keywords.some(k => k.includes(keyword))) {
                score += 0.1;
            }
        }
        score += (qa.helpfulCount / (qa.clickCount + 1)) * 0.1;
        return { ...qa, score: Math.min(score, 1.0) };
    });
    return scored
        .filter(r => r.score >= threshold)
        .sort((a, b) => b.score - a.score);
}
function matchPoliciesToProfile(policies, profile) {
    const results = [];
    const profileTagIds = profile.tags.map(t => t.id);
    const age = profile.age;
    const district = profile.address.district;
    for (const policy of policies) {
        let score = 0;
        const reasons = [];
        if (policy.targetAudience && policy.targetAudience.length > 0) {
            for (const audience of policy.targetAudience) {
                if (profileTagIds.some(t => t.includes(audience)) ||
                    audience.includes(age.toString()) ||
                    (audience === '老年人' && age >= 60) ||
                    (audience === '青年' && age >= 18 && age <= 35) ||
                    (audience === '儿童' && age <= 14) ||
                    (audience === '企业' && profileTagIds.includes('business-owner'))) {
                    score += 0.3;
                    reasons.push(`符合目标人群：${audience}`);
                }
            }
        }
        for (const keyword of policy.keywords) {
            if (profile.tags.some(t => t.name.includes(keyword) || keyword.includes(t.name))) {
                score += 0.2;
                reasons.push(`匹配标签：${keyword}`);
            }
        }
        if (policy.category && profile.preferences.favoriteCategories.includes(policy.category)) {
            score += 0.2;
            reasons.push(`属于您关注的领域`);
        }
        if (policy.content.includes(district)) {
            score += 0.1;
            reasons.push(`与${district}相关`);
        }
        if (score > 0.2) {
            results.push({ ...policy, matchScore: Math.min(score, 1.0), matchReasons: reasons });
        }
    }
    return results.sort((a, b) => b.matchScore - a.matchScore);
}
//# sourceMappingURL=knowledge-graph.js.map