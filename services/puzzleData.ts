
import { Puzzle, InteractionType } from "../types";

export const STATIC_PUZZLES: Record<string, Puzzle[]> = {
  'Two Pointers': [
    {
      id: 'tp-reverse',
      topic: 'Two Pointers',
      title: 'String/Array Reversal',
      challengeGoal: 'Implement the reverse_list function to swap elements in-place using two pointers.',
      interactionMode: InteractionType.SWAP,
      explanation: "The two-pointer technique minimizes time complexity by processing from both ends simultaneously.",
      scenarios: [
        {
          id: 'tp-rev-1',
          name: 'Even Length [H,E,L,P]',
          initialState: {
            objects: [
              { id: 'n1', type: 'box', label: 'H', x: 100, y: 200, color: '#4f46e5' },
              { id: 'n2', type: 'box', label: 'E', x: 200, y: 200, color: '#4f46e5' },
              { id: 'n3', type: 'box', label: 'L', x: 300, y: 200, color: '#4f46e5' },
              { id: 'n4', type: 'box', label: 'P', x: 400, y: 200, color: '#4f46e5' }
            ]
          },
          victoryCondition: { criteria: {}, explanation: "Final state should be P-L-E-H" }
        },
        {
          id: 'tp-rev-2',
          name: 'Odd Length [A,B,C]',
          initialState: {
            objects: [
              { id: 'n1', type: 'box', label: 'A', x: 100, y: 200 },
              { id: 'n2', type: 'box', label: 'B', x: 200, y: 200 },
              { id: 'n3', type: 'box', label: 'C', x: 300, y: 200 }
            ]
          },
          victoryCondition: { criteria: {}, explanation: "Center element stays put." }
        }
      ]
    }
  ],
  'Sliding Window': [
    {
      id: 'sw-max-sum',
      topic: 'Sliding Window',
      title: 'Fixed Window Sum',
      challengeGoal: 'Implement find_max_sum(arr, k) to return the maximum sum of any window of size k.',
      interactionMode: InteractionType.RESIZE_WINDOW,
      explanation: "Sliding window avoids redundant re-calculation by shifting indices.",
      scenarios: [
        {
          id: 'sw-1',
          name: 'K=2 [1, 4, 2, 10]',
          initialState: {
            objects: [
              { id: 'v1', type: 'box', label: '1', x: 100, y: 200 },
              { id: 'v2', type: 'box', label: '4', x: 180, y: 200 },
              { id: 'v3', type: 'box', label: '2', x: 260, y: 200 },
              { id: 'v4', type: 'box', label: '10', x: 340, y: 200 }
            ]
          },
          victoryCondition: { criteria: {}, explanation: "Window should calculate [5, 6, 12]" }
        }
      ]
    }
  ],
  'Linked Lists': [
    {
      id: 'll-reverse',
      topic: 'Linked Lists',
      title: 'In-place Reversal',
      challengeGoal: 'Implement the reverse_linked_list function using the provided Node class.',
      interactionMode: InteractionType.LINK,
      explanation: "Pointer manipulation is core to linked list problems.",
      scenarios: [
        {
          id: 'll-r-1',
          name: '3-Node Chain',
          initialState: {
            objects: [
              { id: 'n1', type: 'circle', label: '1', x: 100, y: 200 },
              { id: 'n2', type: 'circle', label: '2', x: 250, y: 200 },
              { id: 'n3', type: 'circle', label: '3', x: 400, y: 200 },
              { id: 'l1', type: 'connection', sourceId: 'n1', targetId: 'n2', isDirected: true, x:0, y:0, label:'' },
              { id: 'l2', type: 'connection', sourceId: 'n2', targetId: 'n3', isDirected: true, x:0, y:0, label:'' }
            ]
          },
          victoryCondition: { criteria: {}, explanation: "Chain must point 3 -> 2 -> 1" }
        }
      ]
    }
  ]
};

export const getStarterCode = (puzzleId: string): string => {
  switch (puzzleId) {
    case 'tp-reverse':
      return `def reverse_list(arr):\n    # TODO: Implement the two-pointer approach to reverse the list in-place\n    # Use two indices (left and right) and swap elements until they meet\n    pass\n\n# Input variable 'arr' is injected from the test case\nreverse_list(arr)`;
    case 'sw-max-sum':
      return `def find_max_sum(arr, k):\n    # TODO: Calculate the maximum sum of a window of size 'k'\n    # Tip: Initialize with the first window, then slide it across the array\n    return 0\n\n# Input variables 'arr' and 'k' are injected from the test case\nresult = find_max_sum(arr, k)`;
    case 'll-reverse':
      return `class Node(VisualProxy):\n    def __init__(self, val):\n        super().__init__(val)\n        self.next = None\n\ndef reverse_linked_list(head):\n    # TODO: Reverse the pointers of the nodes starting from 'head'\n    # Return the new head of the reversed list\n    pass\n\n# Input variable 'head' is injected from the test case\nnew_head = reverse_linked_list(head)`;
    default:
      return `# Write your solution below\n`;
  }
};

export const getTestCaseData = (puzzleId: string, scenarioIdx: number): string => {
  // Returns python code to setup variables for the specific test case
  switch (puzzleId) {
    case 'tp-reverse':
      return scenarioIdx === 0 ? "arr = ['H', 'E', 'L', 'P']" : "arr = ['A', 'B', 'C']";
    case 'sw-max-sum':
      return "arr = [1, 4, 2, 10]\nk = 2";
    case 'll-reverse':
      return `n1 = Node(1)\nn2 = Node(2)\nn3 = Node(3)\nn1.next = n2\nn2.next = n3\nhead = n1`;
    default:
      return "";
  }
};
