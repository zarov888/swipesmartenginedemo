import { PolicyVersion, Rule } from './types';
import { PolicyVersion, PolicyRegistry, Rule } from './types';
import { hashString } from './prng';
import { sampleRules } from './mockData';

export interface PolicyRegistry {
  currentVersion: string;
  pinnedVersion?: string;
  versions: PolicyVersion[];
  lastFetchedAt: number;
}


// Generate signature hash from rules
function generateSignature(rules: Rule[]): string {
  const ruleString = JSON.stringify(rules.map(r => ({
    id: r.id,
    type: r.type,
    priority: r.priority,
    condition: r.condition,
    action: r.action,
  })));
  return hashString(ruleString);
}

// Create policy versions
const createPolicyVersions = (): PolicyVersion[] => {
  const v1Rules = sampleRules.slice(0, 5);
  const v2Rules = sampleRules.slice(0, 7);
  const v3Rules = [...sampleRules];

  return [
    {
      version: '1.0.0',
      effectiveDate: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      signatureHash: generateSignature(v1Rules),
      rules: v1Rules,
      description: 'Initial policy release - basic routing rules',
      isCached: false,
    },
    {
      version: '1.1.0',
      effectiveDate: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
      signatureHash: generateSignature(v2Rules),
      rules: v2Rules,
      description: 'Added travel and gas station rules',
      isCached: false,
    },
    {
      version: '2.0.0',
      effectiveDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      signatureHash: generateSignature(v3Rules),
      rules: v3Rules,
      description: 'Major update - complete rule set with boost/penalize actions',
      isCached: true, // Most recent is cached
    },
  ];
};

// Initialize registry
let registry: PolicyRegistry = {
  currentVersion: '2.0.0',
  pinnedVersion: undefined,
  versions: createPolicyVersions(),
  lastFetchedAt: Date.now(),
};

export function getPolicyRegistry(): PolicyRegistry {
  return { ...registry };
}

export function getActivePolicy(): PolicyVersion {
  const targetVersion = registry.pinnedVersion || registry.currentVersion;
  const policy = registry.versions.find(v => v.version === targetVersion);
  if (!policy) {
    throw new Error(`Policy version ${targetVersion} not found`);
  }
  return policy;
}

export function pinPolicyVersion(version: string | null): void {
  if (version === null) {
    registry.pinnedVersion = undefined;
  } else {
    const exists = registry.versions.some(v => v.version === version);
    if (!exists) {
      throw new Error(`Cannot pin unknown version: ${version}`);
    }
    registry.pinnedVersion = version;
  }
}

export function isPolicyPinned(): boolean {
  return registry.pinnedVersion !== undefined;
}

export function getPinnedVersion(): string | undefined {
  return registry.pinnedVersion;
}

export function getAllVersions(): PolicyVersion[] {
  return registry.versions.map(v => ({ ...v }));
}

export function updatePolicyCache(version: string, isCached: boolean): void {
  const policy = registry.versions.find(v => v.version === version);
  if (policy) {
    policy.isCached = isCached;
  }
}

export function addCustomRule(rule: Rule): void {
  // Add to current version
  const currentPolicy = registry.versions.find(v => v.version === registry.currentVersion);
  if (currentPolicy) {
    currentPolicy.rules.push(rule);
    currentPolicy.signatureHash = generateSignature(currentPolicy.rules);
  }
}

export function updateRule(ruleId: string, updates: Partial<Rule>): void {
  const currentPolicy = registry.versions.find(v => v.version === registry.currentVersion);
  if (currentPolicy) {
    const ruleIndex = currentPolicy.rules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      currentPolicy.rules[ruleIndex] = { ...currentPolicy.rules[ruleIndex], ...updates };
      currentPolicy.signatureHash = generateSignature(currentPolicy.rules);
    }
  }
}

export function removeRule(ruleId: string): void {
  const currentPolicy = registry.versions.find(v => v.version === registry.currentVersion);
  if (currentPolicy) {
    currentPolicy.rules = currentPolicy.rules.filter(r => r.id !== ruleId);
    currentPolicy.signatureHash = generateSignature(currentPolicy.rules);
  }
}

export function reorderRules(ruleIds: string[]): void {
  const currentPolicy = registry.versions.find(v => v.version === registry.currentVersion);
  if (currentPolicy) {
    const ruleMap = new Map(currentPolicy.rules.map(r => [r.id, r]));
    const reordered: Rule[] = [];
    
    ruleIds.forEach((id, index) => {
      const rule = ruleMap.get(id);
      if (rule) {
        reordered.push({ ...rule, priority: index + 1 });
      }
    });
    
    // Add any rules not in the reorder list
    currentPolicy.rules.forEach(rule => {
      if (!ruleIds.includes(rule.id)) {
        reordered.push({ ...rule, priority: reordered.length + 1 });
      }
    });
    
    currentPolicy.rules = reordered;
    currentPolicy.signatureHash = generateSignature(currentPolicy.rules);
  }
}

// Simulate policy fetch latency
export function simulatePolicyFetch(isCached: boolean, latencyRange: [number, number]): number {
  const [min, max] = latencyRange;
  // Cached policies are faster
  if (isCached) {
    return Math.round(min + Math.random() * ((max - min) * 0.3));
  }
  return Math.round(min + Math.random() * (max - min));
}

// Reset registry to initial state
export function resetRegistry(): void {
  registry = {
    currentVersion: '2.0.0',
    pinnedVersion: undefined,
    versions: createPolicyVersions(),
    lastFetchedAt: Date.now(),
  };
}
