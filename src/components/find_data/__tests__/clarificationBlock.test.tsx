import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClarificationBlock } from '../blocks/ClarificationBlock';
import { ClarificationQuestion } from '../model/FindDataTask';

const openQuestion: ClarificationQuestion = {
  id: 'question_1', question: '请选择比较基准', type: 'SINGLE',
  options: [{ id: 'average', label: '全区平均' }], resolution: { status: 'OPEN', selectedOptionIds: [] }
};

afterEach(cleanup);

describe('ClarificationBlock submission lifecycle', () => {
  it('recovers from a failed submission and permits a retry', async () => {
    const onSubmit = vi.fn()
      .mockRejectedValueOnce(new Error('提交失败，请重试。'))
      .mockResolvedValueOnce(undefined);
    render(<ClarificationBlock question={openQuestion} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('radio', { name: '全区平均' }));
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    expect(await screen.findByText('提交失败，请重试。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '继续' })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit).toHaveBeenNthCalledWith(1, 'question_1', ['average']);
    expect(onSubmit).toHaveBeenNthCalledWith(2, 'question_1', ['average']);
  });

  it('renders a resolved historical question as a compact, expandable read-only record', () => {
    render(<ClarificationBlock question={{ ...openQuestion, resolution: { status: 'RESOLVED', selectedOptionIds: ['average'], resolvedAt: '', resolvedAtRequirementRevision: 2 } }} onSubmit={vi.fn(async () => {})} />);
    expect(screen.getByText('已确认比较基准：全区平均')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '继续' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '展开历史选项' }));
    expect(screen.getByText('请选择比较基准')).toBeInTheDocument();
    expect(screen.getByText('全区平均')).toBeInTheDocument();
  });

  it('keeps a stale decision viewable but never submit-ready', () => {
    render(<ClarificationBlock question={{ ...openQuestion, resolution: { status: 'STALE', selectedOptionIds: ['average'], staleReason: '需求更新' } }} onSubmit={vi.fn(async () => {})} />);
    expect(screen.getByText('当前需求已变化，此选择已失效。')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '继续' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '展开历史选项' }));
    expect(screen.getByText('全区平均')).toBeInTheDocument();
  });
});
