import { describe, it, expect } from 'vitest';
import {
  briefSchema,
  briefItemSchema,
  briefToItem,
  briefAction,
  postSchema,
  scoreTotal,
  SCORE_MAX,
  WRITE_THRESHOLD,
  AUTOPUBLISH_THRESHOLD,
  type Scores,
  type Fact,
} from './blog-schema';

function scores(overrides: Partial<Scores> = {}): Scores {
  return {
    searchDemand: 4,
    audienceFit: 4,
    engagement: 4,
    ourAngle: 4,
    durability: 4,
    evidence: 4,
    ...overrides,
  };
}

function fact(overrides: Partial<Fact> = {}): Fact {
  return {
    claim: 'Australian SME AI adoption',
    value: '43%',
    sourceUrl: 'https://www.ai.gov.au/news-and-insights/blog/x',
    sourceDate: 'Feb 2026',
    geography: 'AU',
    conflicting: false,
    primarySource: true,
    ...overrides,
  };
}

function brief(overrides: Record<string, unknown> = {}) {
  return {
    briefId: 'ai-emails-that-dont-sound-like-ai',
    topic: 'Getting AI to write emails that do not sound like AI',
    pillar: 'guides' as const,
    suggestedTitle: 'How to Stop Your AI Emails Sounding Like a Robot',
    suggestedSlug: 'ai-emails-that-dont-sound-like-ai',
    timeliness: 'evergreen' as const,
    scores: scores(),
    markdown: 'x'.repeat(300),
    facts: [fact()],
    doNotClaim: [],
    sources: ['https://example.com/a'],
    status: 'queued' as const,
    researchedAt: '2026-07-25T09:00:00.000Z',
    ...overrides,
  };
}

describe('brief schema', () => {
  it('accepts a well-formed brief', () => {
    expect(briefSchema.safeParse(brief()).success).toBe(true);
  });

  it('requires at least one source', () => {
    expect(briefSchema.safeParse(brief({ sources: [] })).success).toBe(false);
  });

  it('rejects non-URL sources', () => {
    expect(
      briefSchema.safeParse(brief({ sources: ['not a url'] })).success,
    ).toBe(false);
  });

  it('holds the suggested title to the SERP budget', () => {
    expect(
      briefSchema.safeParse(brief({ suggestedTitle: 'x'.repeat(66) })).success,
    ).toBe(false);
  });

  it('rejects a pillar outside the tag taxonomy', () => {
    expect(briefSchema.safeParse(brief({ pillar: 'ai' })).success).toBe(false);
  });

  it('rejects out-of-range scores', () => {
    expect(
      briefSchema.safeParse(brief({ scores: scores({ evidence: 6 }) })).success,
    ).toBe(false);
    expect(
      briefSchema.safeParse(brief({ scores: scores({ evidence: 0 }) })).success,
    ).toBe(false);
  });

  it('requires a source URL on every fact', () => {
    expect(
      briefSchema.safeParse(
        brief({ facts: [{ ...fact(), sourceUrl: undefined }] }),
      ).success,
    ).toBe(false);
  });
});

describe('briefToItem', () => {
  it('keys briefs separately from posts', () => {
    const item = briefToItem(briefSchema.parse(brief()));
    expect(item.pk).toBe('BRIEF');
    expect(item.sk).toBe('ai-emails-that-dont-sound-like-ai');
    expect(briefItemSchema.safeParse(item).success).toBe(true);
  });

  it('zero-pads the score so lexicographic order matches numeric order', () => {
    const low = briefToItem(
      briefSchema.parse(brief({ scores: scores({ searchDemand: 1, audienceFit: 3, engagement: 1, ourAngle: 3, durability: 1, evidence: 3 }) })),
    );
    const high = briefToItem(briefSchema.parse(brief({ scores: scores() })));
    // 12 vs 24 — string compare must agree with the numbers.
    expect(low.gsi1sk < high.gsi1sk).toBe(true);
    expect(low.gsi1sk.startsWith('12#')).toBe(true);
    expect(high.gsi1sk.startsWith('24#')).toBe(true);
  });

  it('partitions the index by status so used briefs leave the queue', () => {
    expect(briefToItem(briefSchema.parse(brief())).gsi1pk).toBe('BRIEF#queued');
    expect(
      briefToItem(briefSchema.parse(brief({ status: 'used' }))).gsi1pk,
    ).toBe('BRIEF#used');
  });
});

describe('scoreTotal', () => {
  it('sums all six criteria', () => {
    expect(scoreTotal(scores({ searchDemand: 5 }))).toBe(25);
    expect(
      scoreTotal({
        searchDemand: 5,
        audienceFit: 5,
        engagement: 5,
        ourAngle: 5,
        durability: 5,
        evidence: 5,
      }),
    ).toBe(SCORE_MAX);
  });
});

describe('briefAction', () => {
  it('discards a topic that is weak on audience fit regardless of total', () => {
    const result = briefAction({
      scores: scores({ audienceFit: 2, searchDemand: 5, engagement: 5, durability: 5 }),
      facts: [fact()],
    });
    expect(result.action).toBe('discard');
    expect(result.reasons.join(' ')).toContain('audienceFit');
  });

  it('discards a topic we cannot source, however popular', () => {
    const result = briefAction({
      scores: scores({ evidence: 1, searchDemand: 5, engagement: 5 }),
      facts: [],
    });
    expect(result.action).toBe('discard');
  });

  it('discards a topic with no distinctive angle', () => {
    expect(briefAction({ scores: scores({ ourAngle: 1 }) }).action).toBe(
      'discard',
    );
  });

  it('queues a mid-scoring topic for later', () => {
    const result = briefAction({ scores: scores({ searchDemand: 3, engagement: 3, durability: 3, evidence: 3, ourAngle: 3, audienceFit: 3 }) });
    expect(result.total).toBe(18);
    expect(result.action).toBe('queue');
  });

  it('writes immediately once the write threshold is met', () => {
    const result = briefAction({
      scores: scores(), // 24
      facts: [fact()],
      timeliness: 'evergreen',
    });
    expect(result.total).toBeGreaterThanOrEqual(WRITE_THRESHOLD);
    expect(result.action).toBe('write');
  });

  it('auto-publishes only with a top score AND clean primary-sourced evidence', () => {
    const result = briefAction({
      scores: {
        searchDemand: 5,
        audienceFit: 5,
        engagement: 5,
        ourAngle: 5,
        durability: 4,
        evidence: 5,
      }, // 29
      facts: [fact(), fact({ claim: 'another' })],
      timeliness: 'evergreen',
    });
    expect(result.total).toBeGreaterThanOrEqual(AUTOPUBLISH_THRESHOLD);
    expect(result.action).toBe('write-and-publish');
  });

  describe('evidence gate blocks auto-publish', () => {
    const topScores: Scores = {
      searchDemand: 5,
      audienceFit: 5,
      engagement: 5,
      ourAngle: 5,
      durability: 5,
      evidence: 5,
    };

    it('holds back a brief containing a CONFLICTING fact', () => {
      // This is the real failure mode: contradictory adoption statistics.
      const result = briefAction({
        scores: topScores,
        facts: [fact(), fact({ conflicting: true })],
        timeliness: 'evergreen',
      });
      expect(result.action).toBe('write');
      expect(result.reasons.join(' ')).toContain('CONFLICTING');
    });

    it('holds back a fact not traced to a primary source', () => {
      // The "74% of SMBs" case: quoted everywhere, US-only, via a round-up.
      const result = briefAction({
        scores: topScores,
        facts: [fact({ primarySource: false })],
        timeliness: 'evergreen',
      });
      expect(result.action).toBe('write');
      expect(result.reasons.join(' ')).toContain('primary source');
    });

    it('requires a perfect evidence score to publish unreviewed', () => {
      const result = briefAction({
        scores: { ...topScores, evidence: 4 },
        facts: [fact()],
        timeliness: 'evergreen',
      });
      expect(result.action).toBe('write');
      expect(result.reasons.join(' ')).toContain('evidence scored 4');
    });

    it('never auto-publishes a newsy topic', () => {
      // A launch claim can be overtaken between research and publish.
      const result = briefAction({
        scores: topScores,
        facts: [fact()],
        timeliness: 'newsy',
      });
      expect(result.action).toBe('write');
      expect(result.reasons.join(' ')).toContain('newsy');
    });

    it('reports every blocker, not just the first', () => {
      const result = briefAction({
        scores: { ...topScores, evidence: 3 },
        facts: [fact({ conflicting: true, primarySource: false })],
        timeliness: 'newsy',
      });
      expect(result.action).toBe('write');
      expect(result.reasons.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('thresholds are ordered sensibly', () => {
    expect(WRITE_THRESHOLD).toBeLessThan(AUTOPUBLISH_THRESHOLD);
    expect(AUTOPUBLISH_THRESHOLD).toBeLessThanOrEqual(SCORE_MAX);
  });
});

describe('briefs are isolated from posts in the shared table', () => {
  it('uses a different partition key from posts', () => {
    const item = briefToItem(briefSchema.parse(brief()));
    expect(item.pk).toBe('BRIEF');
    expect(item.pk).not.toBe('POST');
  });

  it('never lands in the index partition the site build reads', () => {
    // The build queries gsi1pk='published'. If a brief could produce that
    // value it would be parsed as a post and fail the build.
    for (const status of ['queued', 'used', 'rejected'] as const) {
      const item = briefToItem(briefSchema.parse(brief({ status })));
      expect(item.gsi1pk).toBe(`BRIEF#${status}`);
      expect(item.gsi1pk).not.toBe('published');
      expect(item.gsi1pk).not.toBe('draft');
    }
  });

  it('a brief item does not validate as a post', () => {
    // Belt and braces: even if one were read, postSchema must reject it.
    const item = briefToItem(briefSchema.parse(brief()));
    expect(postSchema.safeParse(item).success).toBe(false);
  });
});
