import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/store/useStore';
import { findOrphanedContentIds } from '@/store/slices/historySlice';
import { localDateKey } from '@/lib/date';

const initial = useStore.getState();
const st = () => useStore.getState();
beforeEach(() => useStore.setState(initial, true));

describe('geçmiş', () => {
  it("eski (id'siz) geçmiş kayıtları açılışta dönüştürülür", () => {
    st().initData({
      history: [
        { contentId: 'aaaaaaaaaaa', title: 'Video', timestamp: 1, type: 'video' },
        { contentId: 'bbbbbbbbbbb', title: 'Liste', timestamp: 2, type: 'video', pId: 'PL1' },
      ],
    });
    expect(st().history).toEqual([
      expect.objectContaining({ id: 'aaaaaaaaaaa', type: 'video' }),
      expect.objectContaining({
        id: 'PL1',
        type: 'playlist',
        playlistItems: [expect.objectContaining({ contentId: 'bbbbbbbbbbb' })],
      }),
    ]);
  });

  it('kayıt silme yalnızca o içeriğin verisini siler (B6, video ilerlemesi dahil)', () => {
    st().addToHistory({ contentId: 'aaaaaaaaaaa', title: 'A', timestamp: 1, type: 'video' });
    st().addToHistory({ contentId: 'bbbbbbbbbbb', title: 'B', timestamp: 2, type: 'video' });
    st().addNote({ id: 1, contentId: 'aaaaaaaaaaa', text: 'a', time: 0 });
    st().addNote({ id: 2, contentId: 'bbbbbbbbbbb', text: 'b', time: 0 });
    st().updateVideoProgress('aaaaaaaaaaa', 30);
    st().updateVideoProgress('bbbbbbbbbbb', 40);
    st().deleteHistoryItem('aaaaaaaaaaa');
    expect(st().notes.map((n) => n.id)).toEqual([2]);
    expect(st().videoProgress).toEqual({ bbbbbbbbbbb: 40 });
  });

  it('sahipsiz veri bulunur ve onaylı temizlikte yalnızca o silinir (B16)', () => {
    st().addToHistory({ contentId: 'aaaaaaaaaaa', title: 'A', timestamp: 1, type: 'video' });
    st().addNote({ id: 1, contentId: 'aaaaaaaaaaa', text: 'a', time: 0 });
    st().addNote({ id: 2, contentId: 'sahipsiz', text: 'b', time: 0 });
    useStore.setState({ summaries: { sahipsiz: '# x' } });
    expect(findOrphanedContentIds(st())).toEqual(['sahipsiz']);
    expect(st().removeOrphanedData()).toEqual(['sahipsiz']);
    expect(st().notes.map((n) => n.id)).toEqual([1]);
    expect(st().summaries).toEqual({});
  });
});

describe('çalışma verisi', () => {
  it('AI içeriğini değiştirme yalnızca o içeriğin kart/soru/özetini değiştirir, notlara dokunmaz', () => {
    st().addNote({ id: 1, contentId: 'x', text: 'not', time: 0 });
    st().addFlashcard({ id: 2, contentId: 'x', question: 'eski', answer: 'e' });
    st().addFlashcard({ id: 3, contentId: 'y', question: 'diğer', answer: 'd' });
    st().replaceContentAI('x', [{ id: 4, contentId: 'x', question: 'yeni', answer: 'y' }], [], '# Yeni');
    expect(st().flashcards.map((c) => c.id)).toEqual([3, 4]);
    expect(st().summaries.x).toBe('# Yeni');
    expect(st().notes).toHaveLength(1);
  });
});

describe('pomodoro zamanlayıcısı (B4)', () => {
  it('odak bitince yerel güne kayıt, molaya geçiş; süre dolmadan bitmez', () => {
    st().setFocusMinutes(1);
    st().startTimer();
    const endsAt = st().timerEndsAt!;
    expect(st().completeTimerPhase(endsAt - 1)).toBeNull();
    expect(st().completeTimerPhase(endsAt + 5 * 60_000)).toBe('focus');
    expect(st().pomodoroHistory).toEqual({ [localDateKey(endsAt)]: 1 });
    expect(st()).toMatchObject({ timerMode: 'break', timerStatus: 'idle', timerRemainingMs: 5 * 60_000 });
  });

  it('süreler çalışırken kilitli, sınırlar uygulanır', () => {
    st().setFocusMinutes(500);
    expect(st().pomodoroSettings.focusMinutes).toBe(120);
    st().startTimer();
    st().setFocusMinutes(10);
    expect(st().pomodoroSettings.focusMinutes).toBe(120);
  });

  it('duraklat/devam kalan süreyi korur', () => {
    st().startTimer();
    useStore.setState({ timerEndsAt: Date.now() + 60_000 });
    st().pauseTimer();
    expect(st().timerStatus).toBe('paused');
    expect(st().timerRemainingMs).toBeGreaterThan(55_000);
    expect(st().timerRemainingMs).toBeLessThanOrEqual(60_000);
  });
});
