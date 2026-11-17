'use client';

import { useState } from 'react';
import { assessmentType, assessmentTypes, engagementKinds } from '@/content/engagement-types';
import { frameworkFor } from '@/content/frameworks';
import { input, label } from '../ui';

/** Engagement type, then assessment type. Title, target and pre-fill follow the assessment type. */
export default function TypeFields({
  selfs,
  leadSelect,
  dates,
}: {
  selfs: { id: string; label: string }[];
  leadSelect: React.ReactNode;
  dates: React.ReactNode;
}) {
  const [type, setType] = useState<string>('security');
  const [title, setTitle] = useState(assessmentType('security').title);
  const [edited, setEdited] = useState(false);
  const fw = frameworkFor(type);
  const at = assessmentType(type);

  const pick = (t: string) => {
    setType(t);
    if (!edited) setTitle(assessmentType(t).title);
  };

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="kind">Engagement type</label>
          <select id="kind" name="kind" className={input} defaultValue="assessment">
            {engagementKinds.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="assessment_type">Assessment</label>
          <select id="assessment_type" name="assessment_type" className={input} value={type} onChange={(e) => pick(e.target.value)}>
            {assessmentTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        {fw.items.length} {fw.itemLabel === 'subcategory' ? 'NIST CSF 2.0 subcategories' : 'practices'} across {fw.functions.map((f) => f.title).join(', ')}.
        Creates {at.documents.length} standard document requests for the client.
      </p>
      <div>
        <label className={label} htmlFor="title">Title</label>
        <input id="title" name="title" className={input} value={title} onChange={(e) => { setTitle(e.target.value); setEdited(true); }} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {leadSelect}
        {fw.usesIg && (
          <div>
            <label className={label} htmlFor="target_ig">Target profile</label>
            <select id="target_ig" name="target_ig" className={input} defaultValue="2">
              <option value="1">IG1: target maturity 2</option>
              <option value="2">IG2: target maturity 3</option>
              <option value="3">IG3: target maturity 4</option>
            </select>
          </div>
        )}
        {dates}
      </div>
      {fw.usesIg && (
        <div>
          <label className={label} htmlFor="self_assessment_id">Pre-fill from a self-assessment (optional)</label>
          <select id="self_assessment_id" name="self_assessment_id" className={input} defaultValue="">
            <option value="">Start blank</option>
            {selfs.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">Pre-filled ratings are flagged until an assessor confirms each one.</p>
        </div>
      )}
      {!fw.usesIg && <p className="text-xs text-gray-500">Targets start at 3 (Defined) for every practice; adjust them while rating.</p>}
    </>
  );
}
