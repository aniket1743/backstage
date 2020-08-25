/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LocationSpec, Entity } from '@backstage/catalog-model';
import { CatalogRulesEnforcer } from './CatalogRules';

const entity = {
  user: {
    kind: 'User',
  } as Entity,
  group: {
    kind: 'Group',
  } as Entity,
  component: {
    kind: 'component',
  } as Entity,
};

const location: Record<string, LocationSpec> = {
  x: {
    type: 'github',
    target: 'https://github.com/a/b/blob/master/x.yaml',
  },
  y: {
    type: 'github',
    target: 'https://github.com/a/b/blob/master/y.yaml',
  },
  z: {
    type: 'file',
    target: '/root/z.yaml',
  },
};

describe('CatalogRulesEnforcer', () => {
  it('should allow by default', () => {
    const enforcer = new CatalogRulesEnforcer([]);
    expect(enforcer.isAllowed(entity.user, location.x)).toBe(true);
    expect(enforcer.isAllowed(entity.group, location.y)).toBe(true);
    expect(enforcer.isAllowed(entity.component, location.z)).toBe(true);
  });

  it('should deny all', () => {
    const enforcer = new CatalogRulesEnforcer([{ allow: [] }]);
    expect(enforcer.isAllowed(entity.user, location.x)).toBe(false);
    expect(enforcer.isAllowed(entity.group, location.y)).toBe(false);
    expect(enforcer.isAllowed(entity.component, location.z)).toBe(false);
  });

  it('should allow all with override', () => {
    const enforcer = new CatalogRulesEnforcer([{ allow: [] }, { deny: [] }]);
    expect(enforcer.isAllowed(entity.user, location.x)).toBe(true);
    expect(enforcer.isAllowed(entity.group, location.y)).toBe(true);
    expect(enforcer.isAllowed(entity.component, location.z)).toBe(true);
  });

  it('should deny groups', () => {
    const enforcer = new CatalogRulesEnforcer([
      { allow: [], deny: [{ kind: 'Group' }] },
    ]);
    expect(enforcer.isAllowed(entity.user, location.x)).toBe(true);
    expect(enforcer.isAllowed(entity.group, location.x)).toBe(false);
    expect(enforcer.isAllowed(entity.group, location.y)).toBe(false);
    expect(enforcer.isAllowed(entity.group, location.z)).toBe(false);
    expect(enforcer.isAllowed(entity.component, location.z)).toBe(true);
  });

  it('should deny groups from github', () => {
    const enforcer = new CatalogRulesEnforcer([
      { allow: [], deny: [{ kind: 'Group' }], locations: [{ type: 'github' }] },
    ]);
    expect(enforcer.isAllowed(entity.user, location.x)).toBe(true);
    expect(enforcer.isAllowed(entity.group, location.x)).toBe(false);
    expect(enforcer.isAllowed(entity.group, location.y)).toBe(false);
    expect(enforcer.isAllowed(entity.group, location.z)).toBe(true);
    expect(enforcer.isAllowed(entity.component, location.z)).toBe(true);
  });

  it('should override to allow groups from files', () => {
    const enforcer = new CatalogRulesEnforcer([
      { allow: [], deny: [{ kind: 'Group' }] },
      { allow: [{ kind: 'Group' }], deny: [], locations: [{ type: 'file' }] },
    ]);
    expect(enforcer.isAllowed(entity.user, location.x)).toBe(true);
    expect(enforcer.isAllowed(entity.group, location.x)).toBe(false);
    expect(enforcer.isAllowed(entity.group, location.y)).toBe(false);
    expect(enforcer.isAllowed(entity.group, location.z)).toBe(true);
    expect(enforcer.isAllowed(entity.component, location.z)).toBe(true);
  });

  it('should not be sensitive to kind case', () => {
    const enforcer = new CatalogRulesEnforcer([
      { allow: [], deny: [{ kind: 'group' }] },
      { allow: [], deny: [{ kind: 'Component' }] },
    ]);
    expect(enforcer.isAllowed(entity.user, location.x)).toBe(true);
    expect(enforcer.isAllowed(entity.group, location.x)).toBe(false);
    expect(enforcer.isAllowed(entity.group, location.y)).toBe(false);
    expect(enforcer.isAllowed(entity.group, location.z)).toBe(false);
    expect(enforcer.isAllowed(entity.component, location.z)).toBe(false);
  });
});