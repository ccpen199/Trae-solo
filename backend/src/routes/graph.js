const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/application/:id', (req, res) => {
  const { id } = req.params;
  
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const nodes = [];
  const edges = [];
  
  nodes.push({
    id: application.id,
    type: 'application',
    label: application.applicant_name,
    status: application.status,
    score: application.risk_score
  });
  
  const sameIdCard = db.prepare('SELECT * FROM applications WHERE id_card = ? AND id != ?').all(application.id_card, id);
  sameIdCard.forEach(app => {
    nodes.push({
      id: app.id,
      type: 'application',
      label: app.applicant_name,
      status: app.status,
      score: app.risk_score
    });
    edges.push({
      source: id,
      target: app.id,
      type: 'same_id_card',
      label: '同证件'
    });
  });
  
  const samePhone = db.prepare('SELECT * FROM applications WHERE phone = ? AND id != ?').all(application.phone, id);
  samePhone.forEach(app => {
    if (!nodes.find(n => n.id === app.id)) {
      nodes.push({
        id: app.id,
        type: 'application',
        label: app.applicant_name,
        status: app.status,
        score: app.risk_score
      });
    }
    edges.push({
      source: id,
      target: app.id,
      type: 'same_phone',
      label: '同手机号'
    });
  });
  
  const devices = db.prepare('SELECT * FROM device_fingerprint WHERE application_id = ?').all(id);
  devices.forEach(device => {
    nodes.push({
      id: `device_${device.device_id}`,
      type: 'device',
      label: `设备: ${device.device_id.slice(0, 8)}`,
      ip: device.ip_address
    });
    edges.push({
      source: id,
      target: `device_${device.device_id}`,
      type: 'used_device',
      label: '使用设备'
    });
    
    const sameDeviceApps = db.prepare('SELECT DISTINCT a.* FROM applications a JOIN device_fingerprint df ON a.id = df.application_id WHERE df.device_id = ? AND a.id != ?')
      .all(device.device_id, id);
    
    sameDeviceApps.forEach(app => {
      if (!nodes.find(n => n.id === app.id)) {
        nodes.push({
          id: app.id,
          type: 'application',
          label: app.applicant_name,
          status: app.status,
          score: app.risk_score
        });
      }
      edges.push({
        source: `device_${device.device_id}`,
        target: app.id,
        type: 'used_by',
        label: '被使用'
      });
    });
  });
  
  const contacts = db.prepare('SELECT * FROM contacts WHERE application_id = ?').all(id);
  contacts.forEach(contact => {
    const contactNodeId = `contact_${contact.phone}`;
    nodes.push({
      id: contactNodeId,
      type: 'contact',
      label: contact.name,
      phone: contact.phone,
      relationship: contact.relationship
    });
    edges.push({
      source: id,
      target: contactNodeId,
      type: 'has_contact',
      label: `联系人: ${contact.relationship || '其他'}`
    });
    
    const contactInOtherApps = db.prepare('SELECT DISTINCT a.* FROM applications a JOIN contacts c ON a.id = c.application_id WHERE c.phone = ? AND a.id != ?')
      .all(contact.phone, id);
    
    contactInOtherApps.forEach(app => {
      if (!nodes.find(n => n.id === app.id)) {
        nodes.push({
          id: app.id,
          type: 'application',
          label: app.applicant_name,
          status: app.status,
          score: app.risk_score
        });
      }
      edges.push({
        source: contactNodeId,
        target: app.id,
        type: 'contact_of',
        label: '也是联系人'
      });
    });
  });
  
  const blacklistHits = db.prepare('SELECT * FROM blacklist_hits WHERE application_id = ?').all(id);
  blacklistHits.forEach(hit => {
    const blacklistNodeId = `blacklist_${hit.hit_type}_${hit.hit_value}`;
    if (!nodes.find(n => n.id === blacklistNodeId)) {
      nodes.push({
        id: blacklistNodeId,
        type: 'blacklist',
        label: `黑名单: ${hit.hit_type}`,
        value: hit.hit_value,
        confirmed: hit.confirmed
      });
    }
    edges.push({
      source: id,
      target: blacklistNodeId,
      type: 'blacklist_hit',
      label: `命中黑名单`,
      style: 'danger'
    });
  });
  
  res.json({ nodes, edges });
});

module.exports = router;
