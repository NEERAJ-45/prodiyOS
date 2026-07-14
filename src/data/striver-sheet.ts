export interface StriverProblem {
  id: number;
  title: string;
  link: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface StriverDay {
  key: string;
  day: number;
  topic: string;
  problems: {
    easy: StriverProblem[];
    medium: StriverProblem[];
    hard: StriverProblem[];
  };
}

export const striverSheet: StriverDay[] = [
  {
    key: "arrays-1",
    day: 1,
    topic: "Arrays",
    problems: {
      easy: [
        { id: 1, title: "Set Matrix Zeroes", link: "https://leetcode.com/problems/set-matrix-zeroes/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 2, title: "Pascal's Triangle", link: "https://leetcode.com/problems/pascals-triangle/", difficulty: "EASY" },
        { id: 3, title: "Next Permutation", link: "https://leetcode.com/problems/next-permutation/", difficulty: "MEDIUM" },
        { id: 4, title: "Maximum Subarray (Kadane's Algorithm)", link: "https://leetcode.com/problems/maximum-subarray/", difficulty: "MEDIUM" },
        { id: 5, title: "Sort Colors (Dutch National Flag)", link: "https://leetcode.com/problems/sort-colors/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 6, title: "Best Time to Buy and Sell Stock", link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", difficulty: "EASY" },
      ],
    },
  },
  {
    key: "arrays-2",
    day: 2,
    topic: "Arrays Part-II",
    problems: {
      easy: [],
      medium: [
        { id: 7, title: "Rotate Matrix/Image", link: "https://leetcode.com/problems/rotate-image/", difficulty: "MEDIUM" },
        { id: 8, title: "Merge Overlapping Subintervals", link: "https://leetcode.com/problems/merge-intervals/", difficulty: "MEDIUM" },
        { id: 9, title: "Merge Two Sorted Arrays Without Extra Space", link: "https://leetcode.com/problems/merge-sorted-array/", difficulty: "EASY" },
        { id: 10, title: "Find the Duplicate Number", link: "https://leetcode.com/problems/find-the-duplicate-number/", difficulty: "MEDIUM" },
        { id: 11, title: "Repeat and Missing Number", link: "https://leetcode.com/problems/set-mismatch/", difficulty: "EASY" },
      ],
      hard: [
        { id: 12, title: "Count Inversions", link: "https://www.geeksforgeeks.org/inversion-count-in-array-using-merge-sort/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "arrays-3",
    day: 3,
    topic: "Arrays Part-III",
    problems: {
      easy: [
        { id: 13, title: "Search in a 2D Matrix", link: "https://leetcode.com/problems/search-a-2d-matrix/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 14, title: "Pow(x, n)", link: "https://leetcode.com/problems/powx-n/", difficulty: "MEDIUM" },
        { id: 15, title: "Majority Element (>N/2)", link: "https://leetcode.com/problems/majority-element/", difficulty: "EASY" },
        { id: 16, title: "Majority Element II (>N/3)", link: "https://leetcode.com/problems/majority-element-ii/", difficulty: "MEDIUM" },
        { id: 17, title: "Grid Unique Paths", link: "https://leetcode.com/problems/unique-paths/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 18, title: "Reverse Pairs", link: "https://leetcode.com/problems/reverse-pairs/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "arrays-4",
    day: 4,
    topic: "Arrays Part-IV",
    problems: {
      easy: [
        { id: 19, title: "Two Sum", link: "https://leetcode.com/problems/two-sum/", difficulty: "EASY" },
      ],
      medium: [
        { id: 20, title: "4 Sum", link: "https://leetcode.com/problems/4sum/", difficulty: "MEDIUM" },
        { id: 21, title: "Longest Consecutive Sequence", link: "https://leetcode.com/problems/longest-consecutive-sequence/", difficulty: "MEDIUM" },
        { id: 22, title: "Largest Subarray with 0 Sum", link: "https://www.geeksforgeeks.org/find-the-largest-subarray-with-0-sum/", difficulty: "MEDIUM" },
        { id: 23, title: "Count Number of Subarrays with Given XOR K", link: "https://www.interviewbit.com/problems/subarray-with-given-xor/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 24, title: "Longest Substring Without Repeating Characters", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "linked-list-1",
    day: 5,
    topic: "Linked List",
    problems: {
      easy: [
        { id: 25, title: "Reverse Linked List", link: "https://leetcode.com/problems/reverse-linked-list/", difficulty: "EASY" },
        { id: 26, title: "Middle of Linked List", link: "https://leetcode.com/problems/middle-of-the-linked-list/", difficulty: "EASY" },
      ],
      medium: [
        { id: 27, title: "Merge Two Sorted Lists", link: "https://leetcode.com/problems/merge-two-sorted-lists/", difficulty: "EASY" },
        { id: 28, title: "Remove N-th Node from Back of Linked List", link: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", difficulty: "MEDIUM" },
        { id: 29, title: "Add Two Numbers as Linked Lists", link: "https://leetcode.com/problems/add-two-numbers/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 30, title: "Delete a Given Node When Node is Given (O(1))", link: "https://leetcode.com/problems/delete-node-in-a-linked-list/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "linked-list-2",
    day: 6,
    topic: "Linked List Part-II",
    problems: {
      easy: [
        { id: 31, title: "Intersection of Two Linked Lists", link: "https://leetcode.com/problems/intersection-of-two-linked-lists/", difficulty: "EASY" },
      ],
      medium: [
        { id: 32, title: "Linked List Cycle II", link: "https://leetcode.com/problems/linked-list-cycle-ii/", difficulty: "MEDIUM" },
        { id: 33, title: "Flatten a Linked List", link: "https://www.geeksforgeeks.org/flatten-a-linked-list-with-next-and-child-pointers/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 34, title: "Rotate List", link: "https://leetcode.com/problems/rotate-list/", difficulty: "MEDIUM" },
        { id: 35, title: "Copy List with Random Pointer", link: "https://leetcode.com/problems/copy-list-with-random-pointer/", difficulty: "HARD" },
        { id: 36, title: "3 Sum", link: "https://leetcode.com/problems/3sum/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "linked-list-arrays",
    day: 7,
    topic: "Linked List and Arrays",
    problems: {
      easy: [
        { id: 37, title: "Trapping Rain Water", link: "https://leetcode.com/problems/trapping-rain-water/", difficulty: "HARD" },
      ],
      medium: [
        { id: 38, title: "Remove Duplicates from Sorted Array", link: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/", difficulty: "EASY" },
        { id: 39, title: "Max Consecutive Ones", link: "https://leetcode.com/problems/max-consecutive-ones/", difficulty: "EASY" },
      ],
      hard: [
        { id: 40, title: "Max Consecutive Ones III", link: "https://leetcode.com/problems/max-consecutive-ones-iii/", difficulty: "MEDIUM" },
        { id: 41, title: "Longest Subarray with Sum K (Positives + Negatives)", link: "https://www.geeksforgeeks.org/longest-sub-array-sum-k/", difficulty: "MEDIUM" },
        { id: 42, title: "Container With Most Water", link: "https://leetcode.com/problems/container-with-most-water/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "greedy",
    day: 8,
    topic: "Greedy Algorithm",
    problems: {
      easy: [
        { id: 43, title: "N Meetings in One Room", link: "https://www.geeksforgeeks.org/find-maximum-meetings-in-one-room/", difficulty: "MEDIUM" },
        { id: 44, title: "Minimum Number of Platforms", link: "https://www.geeksforgeeks.org/minimum-number-of-platforms-required-for-a-railway-bus-station/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 45, title: "Job Sequencing Problem", link: "https://www.geeksforgeeks.org/job-sequencing-problem/", difficulty: "MEDIUM" },
        { id: 46, title: "Fractional Knapsack", link: "https://www.geeksforgeeks.org/fractional-knapsack-problem/", difficulty: "MEDIUM" },
        { id: 47, title: "Greedy Algorithm to Find Minimum Number of Coins", link: "https://www.geeksforgeeks.org/greedy-algorithm-to-find-minimum-number-of-coins/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 48, title: "Activity Selection", link: "https://www.geeksforgeeks.org/activity-selection-problem-greedy-algo-1/", difficulty: "EASY" },
      ],
    },
  },
  {
    key: "recursion",
    day: 9,
    topic: "Recursion",
    problems: {
      easy: [
        { id: 49, title: "Subset Sums", link: "https://www.geeksforgeeks.org/subset-sum-problem/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 50, title: "Subset II (Unique Subsets)", link: "https://leetcode.com/problems/subsets-ii/", difficulty: "MEDIUM" },
        { id: 51, title: "Combination Sum", link: "https://leetcode.com/problems/combination-sum/", difficulty: "MEDIUM" },
        { id: 52, title: "Combination Sum II", link: "https://leetcode.com/problems/combination-sum-ii/", difficulty: "MEDIUM" },
        { id: 53, title: "Palindrome Partitioning", link: "https://leetcode.com/problems/palindrome-partitioning/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 54, title: "K-th Permutation Sequence", link: "https://leetcode.com/problems/permutation-sequence/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "recursion-backtracking",
    day: 10,
    topic: "Recursion and Backtracking",
    problems: {
      easy: [],
      medium: [
        { id: 55, title: "Permutations", link: "https://leetcode.com/problems/permutations/", difficulty: "MEDIUM" },
        { id: 56, title: "N-Queens", link: "https://leetcode.com/problems/n-queens/", difficulty: "HARD" },
        { id: 57, title: "Sudoku Solver", link: "https://leetcode.com/problems/sudoku-solver/", difficulty: "HARD" },
        { id: 58, title: "M-Coloring Problem", link: "https://www.geeksforgeeks.org/m-coloring-problem/", difficulty: "MEDIUM" },
        { id: 59, title: "Rat in a Maze", link: "https://www.geeksforgeeks.org/rat-in-a-maze-backtracking-2/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 60, title: "Word Break II (Print All Ways)", link: "https://leetcode.com/problems/word-break-ii/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "binary-search",
    day: 11,
    topic: "Binary Search",
    problems: {
      easy: [
        { id: 61, title: "Nth Root of a Number (Binary Search)", link: "https://www.geeksforgeeks.org/nth-root-of-a-number-using-binary-search/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 62, title: "Matrix Median", link: "https://www.interviewbit.com/problems/matrix-median/", difficulty: "HARD" },
        { id: 63, title: "Find the Element that Appears Once in Sorted Array", link: "https://leetcode.com/problems/single-element-in-a-sorted-array/", difficulty: "MEDIUM" },
        { id: 64, title: "Search in Rotated Sorted Array", link: "https://leetcode.com/problems/search-in-rotated-sorted-array/", difficulty: "MEDIUM" },
        { id: 65, title: "Median of Two Sorted Arrays", link: "https://leetcode.com/problems/median-of-two-sorted-arrays/", difficulty: "HARD" },
        { id: 66, title: "K-th Element of Two Sorted Arrays", link: "https://www.geeksforgeeks.org/k-th-element-two-sorted-arrays/", difficulty: "HARD" },
      ],
      hard: [
        { id: 67, title: "Allocate Minimum Number of Pages", link: "https://www.geeksforgeeks.org/allocate-minimum-number-pages/", difficulty: "HARD" },
        { id: 68, title: "Aggressive Cows", link: "https://www.geeksforgeeks.org/aggressive-cows/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "heaps",
    day: 12,
    topic: "Heaps",
    problems: {
      easy: [
        { id: 69, title: "K-th Largest Element in an Array", link: "https://leetcode.com/problems/kth-largest-element-in-an-array/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 70, title: "K-th Smallest Element in an Array", link: "https://www.geeksforgeeks.org/kth-smallest-element-in-a-row-wise-and-column-wise-sorted-matrix/", difficulty: "MEDIUM" },
        { id: 71, title: "Merge K Sorted Arrays", link: "https://leetcode.com/problems/merge-k-sorted-lists/", difficulty: "HARD" },
        { id: 72, title: "Top K Frequent Elements", link: "https://leetcode.com/problems/top-k-frequent-elements/", difficulty: "MEDIUM" },
        { id: 73, title: "K Most Frequent Elements (using Heap)", link: "https://www.geeksforgeeks.org/find-k-numbers-occurrences-given-array/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 74, title: "Find Median from Data Stream", link: "https://leetcode.com/problems/find-median-from-data-stream/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "stack-queue-1",
    day: 13,
    topic: "Stack and Queue",
    problems: {
      easy: [
        { id: 75, title: "Implement Stack using Arrays", link: "https://www.geeksforgeeks.org/stack-data-structure-introduction-program/", difficulty: "EASY" },
        { id: 76, title: "Implement Queue using Arrays", link: "https://www.geeksforgeeks.org/queue-data-structure/", difficulty: "EASY" },
      ],
      medium: [
        { id: 77, title: "Implement Stack using Queue", link: "https://leetcode.com/problems/implement-stack-using-queues/", difficulty: "EASY" },
        { id: 78, title: "Implement Queue using Stack", link: "https://leetcode.com/problems/implement-queue-using-stacks/", difficulty: "EASY" },
        { id: 79, title: "Check for Balanced Parentheses", link: "https://leetcode.com/problems/valid-parentheses/", difficulty: "EASY" },
        { id: 80, title: "Next Greater Element", link: "https://leetcode.com/problems/next-greater-element-i/", difficulty: "EASY" },
      ],
      hard: [
        { id: 81, title: "Sort a Stack", link: "https://www.geeksforgeeks.org/sort-a-stack-using-recursion/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "stack-queue-2",
    day: 14,
    topic: "Stack and Queue Part-II",
    problems: {
      easy: [],
      medium: [
        { id: 82, title: "Nearest Smaller Element / Next Smaller Element", link: "https://www.interviewbit.com/problems/nearest-smaller-element/", difficulty: "MEDIUM" },
        { id: 83, title: "Largest Rectangle in Histogram", link: "https://leetcode.com/problems/largest-rectangle-in-histogram/", difficulty: "HARD" },
        { id: 84, title: "Sliding Window Maximum", link: "https://leetcode.com/problems/sliding-window-maximum/", difficulty: "HARD" },
        { id: 85, title: "Min Stack", link: "https://leetcode.com/problems/min-stack/", difficulty: "MEDIUM" },
        { id: 86, title: "Rotting Oranges", link: "https://leetcode.com/problems/rotting-oranges/", difficulty: "MEDIUM" },
        { id: 87, title: "Stock Span Problem", link: "https://leetcode.com/problems/online-stock-span/", difficulty: "MEDIUM" },
        { id: 88, title: "Celebrity Problem", link: "https://www.geeksforgeeks.org/the-celebrity-problem/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 89, title: "Maximum of Minimums of Every Window Size", link: "https://www.geeksforgeeks.org/find-maximum-minimums-sliding-window-sizes/", difficulty: "HARD" },
        { id: 90, title: "LRU Cache Implementation", link: "https://leetcode.com/problems/lru-cache/", difficulty: "MEDIUM" },
        { id: 91, title: "LFU Cache Implementation", link: "https://leetcode.com/problems/lfu-cache/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "string-1",
    day: 15,
    topic: "String",
    problems: {
      easy: [
        { id: 92, title: "Reverse Words in a String", link: "https://leetcode.com/problems/reverse-words-in-a-string/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 93, title: "Longest Palindrome in a String", link: "https://leetcode.com/problems/longest-palindromic-substring/", difficulty: "MEDIUM" },
        { id: 94, title: "Roman Number to Integer and Vice Versa", link: "https://leetcode.com/problems/roman-to-integer/", difficulty: "EASY" },
        { id: 95, title: "Implement ATOI/STRSTR", link: "https://leetcode.com/problems/string-to-integer-atoi/", difficulty: "MEDIUM" },
        { id: 96, title: "Longest Common Prefix", link: "https://leetcode.com/problems/longest-common-prefix/", difficulty: "EASY" },
      ],
      hard: [
        { id: 97, title: "Rabin-Karp String Matching Algorithm", link: "https://www.geeksforgeeks.org/rabin-karp-algorithm-for-pattern-searching/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "string-2",
    day: 16,
    topic: "String Part-II",
    problems: {
      easy: [
        { id: 98, title: "Z-Function Pattern Matching", link: "https://www.geeksforgeeks.org/z-algorithm-pattern-searching/", difficulty: "HARD" },
      ],
      medium: [
        { id: 99, title: "KMP Algorithm (Pattern Matching)", link: "https://www.geeksforgeeks.org/kmp-algorithm-for-pattern-searching/", difficulty: "HARD" },
        { id: 100, title: "Check for Anagrams", link: "https://leetcode.com/problems/valid-anagram/", difficulty: "EASY" },
        { id: 101, title: "Count and Say", link: "https://leetcode.com/problems/count-and-say/", difficulty: "MEDIUM" },
        { id: 102, title: "Compare Version Numbers", link: "https://leetcode.com/problems/compare-version-numbers/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 103, title: "Minimum Characters Needed to Make String Palindrome", link: "https://www.geeksforgeeks.org/minimum-characters-added-front-make-string-palindrome/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "binary-tree-1",
    day: 17,
    topic: "Binary Tree",
    problems: {
      easy: [
        { id: 104, title: "Inorder Traversal", link: "https://leetcode.com/problems/binary-tree-inorder-traversal/", difficulty: "EASY" },
        { id: 105, title: "Preorder Traversal", link: "https://leetcode.com/problems/binary-tree-preorder-traversal/", difficulty: "EASY" },
        { id: 106, title: "Postorder Traversal", link: "https://leetcode.com/problems/binary-tree-postorder-traversal/", difficulty: "EASY" },
      ],
      medium: [
        { id: 107, title: "Level Order Traversal", link: "https://leetcode.com/problems/binary-tree-level-order-traversal/", difficulty: "MEDIUM" },
        { id: 108, title: "Maximum Depth of Binary Tree", link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", difficulty: "EASY" },
        { id: 109, title: "Balanced Binary Tree Check", link: "https://leetcode.com/problems/balanced-binary-tree/", difficulty: "EASY" },
        { id: 110, title: "Diameter of Binary Tree", link: "https://leetcode.com/problems/diameter-of-binary-tree/", difficulty: "EASY" },
        { id: 111, title: "Binary Tree Maximum Path Sum", link: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", difficulty: "HARD" },
      ],
      hard: [
        { id: 112, title: "Same Tree", link: "https://leetcode.com/problems/same-tree/", difficulty: "EASY" },
        { id: 113, title: "Zig-Zag Level Order Traversal", link: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/", difficulty: "MEDIUM" },
        { id: 114, title: "Boundary Traversal of Binary Tree", link: "https://www.geeksforgeeks.org/boundary-traversal-of-binary-tree/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "binary-tree-2",
    day: 18,
    topic: "Binary Tree Part-II",
    problems: {
      easy: [
        { id: 115, title: "Vertical Order Traversal", link: "https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree/", difficulty: "HARD" },
      ],
      medium: [
        { id: 116, title: "Top View of Binary Tree", link: "https://www.geeksforgeeks.org/print-nodes-top-view-binary-tree/", difficulty: "MEDIUM" },
        { id: 117, title: "Bottom View of Binary Tree", link: "https://www.geeksforgeeks.org/bottom-view-binary-tree/", difficulty: "MEDIUM" },
        { id: 118, title: "Left/Right View of Binary Tree", link: "https://leetcode.com/problems/binary-tree-right-side-view/", difficulty: "MEDIUM" },
        { id: 119, title: "Symmetric Binary Tree", link: "https://leetcode.com/problems/symmetric-tree/", difficulty: "EASY" },
      ],
      hard: [
        { id: 120, title: "Root to Leaf Paths", link: "https://leetcode.com/problems/binary-tree-paths/", difficulty: "EASY" },
        { id: 121, title: "Maximum Width of Binary Tree", link: "https://leetcode.com/problems/maximum-width-of-binary-tree/", difficulty: "MEDIUM" },
        { id: 122, title: "Construct BT from Preorder + Inorder", link: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "binary-tree-3",
    day: 19,
    topic: "Binary Tree Part-III",
    problems: {
      easy: [],
      medium: [
        { id: 123, title: "Construct BT from Postorder + Inorder", link: "https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/", difficulty: "MEDIUM" },
        { id: 124, title: "Serialize and Deserialize Binary Tree", link: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", difficulty: "HARD" },
        { id: 125, title: "Flatten Binary Tree to Linked List", link: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list/", difficulty: "MEDIUM" },
        { id: 126, title: "Print All Nodes at Distance K in Binary Tree", link: "https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/", difficulty: "MEDIUM" },
        { id: 127, title: "Lowest Common Ancestor in Binary Tree", link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", difficulty: "MEDIUM" },
        { id: 128, title: "Count Total Nodes in Complete Binary Tree", link: "https://leetcode.com/problems/count-complete-tree-nodes/", difficulty: "EASY" },
      ],
      hard: [
        { id: 129, title: "Burn a Binary Tree (Min Time to Burn)", link: "https://www.geeksforgeeks.org/minimum-time-to-burn-a-tree-starting-from-a-leaf-node/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "bst-1",
    day: 20,
    topic: "Binary Search Tree",
    problems: {
      easy: [
        { id: 130, title: "Search in BST", link: "https://leetcode.com/problems/search-in-a-binary-search-tree/", difficulty: "EASY" },
        { id: 131, title: "Insert into BST", link: "https://leetcode.com/problems/insert-into-a-binary-search-tree/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 132, title: "Delete a Node from BST", link: "https://leetcode.com/problems/delete-node-in-a-bst/", difficulty: "MEDIUM" },
        { id: 133, title: "K-th Smallest Element in BST", link: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", difficulty: "MEDIUM" },
        { id: 134, title: "Validate BST", link: "https://leetcode.com/problems/validate-binary-search-tree/", difficulty: "MEDIUM" },
        { id: 135, title: "LCA in BST", link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 136, title: "K-th Largest Element in BST", link: "https://www.geeksforgeeks.org/kth-largest-element-in-bst-when-modification-to-bst-is-not-allowed/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "bst-2",
    day: 21,
    topic: "Binary Search Tree Part-II",
    problems: {
      easy: [
        { id: 137, title: "Floor and Ceil in BST", link: "https://www.geeksforgeeks.org/floor-and-ceil-from-a-bst/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 138, title: "Find the Inorder Predecessor/Successor in BST", link: "https://www.geeksforgeeks.org/inorder-predecessor-successor-given-key-bst/", difficulty: "MEDIUM" },
        { id: 139, title: "Merge Two BSTs (Sorted Output)", link: "https://www.geeksforgeeks.org/merge-two-bsts-with-limited-extra-space/", difficulty: "HARD" },
        { id: 140, title: "Two Sum in BST", link: "https://leetcode.com/problems/two-sum-iv-input-is-a-bst/", difficulty: "EASY" },
        { id: 141, title: "Recover BST (Correct BST with Two Nodes Swapped)", link: "https://leetcode.com/problems/recover-binary-search-tree/", difficulty: "MEDIUM" },
        { id: 142, title: "Largest BST in a Binary Tree", link: "https://www.geeksforgeeks.org/largest-bst-binary-tree-set-2/", difficulty: "HARD" },
      ],
      hard: [
        { id: 143, title: "Serialize and Deserialize BST", link: "https://leetcode.com/problems/serialize-and-deserialize-bst/", difficulty: "MEDIUM" },
        { id: 144, title: "Convert Sorted Array to Height-Balanced BST", link: "https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/", difficulty: "EASY" },
      ],
    },
  },
  {
    key: "binary-tree-misc",
    day: 22,
    topic: "Binary Trees [Miscellaneous]",
    problems: {
      easy: [
        { id: 145, title: "Flatten BST to Sorted List", link: "https://www.geeksforgeeks.org/flatten-bst-to-sorted-list/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 146, title: "Binary Tree to Doubly Linked List", link: "https://leetcode.com/problems/convert-binary-search-tree-to-sorted-doubly-linked-list/", difficulty: "MEDIUM" },
        { id: 147, title: "Kth Largest Element in a Stream", link: "https://leetcode.com/problems/kth-largest-element-in-a-stream/", difficulty: "EASY" },
        { id: 148, title: "Maximum Sum BST in Binary Tree", link: "https://leetcode.com/problems/maximum-sum-bst-in-binary-tree/", difficulty: "HARD" },
        { id: 149, title: "Median in a Stream of Integers", link: "https://www.geeksforgeeks.org/median-of-stream-of-integers-running-integers/", difficulty: "HARD" },
      ],
      hard: [
        { id: 150, title: "Count Distinct Elements in Every Window of Size K", link: "https://www.geeksforgeeks.org/count-distinct-elements-in-every-window-of-size-k/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "graph-1",
    day: 23,
    topic: "Graph",
    problems: {
      easy: [
        { id: 151, title: "Clone a Graph", link: "https://leetcode.com/problems/clone-graph/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 152, title: "DFS Traversal (Graph)", link: "https://www.geeksforgeeks.org/depth-first-search-or-dfs-for-a-graph/", difficulty: "EASY" },
        { id: 153, title: "BFS Traversal (Graph)", link: "https://www.geeksforgeeks.org/breadth-first-search-or-bfs-for-a-graph/", difficulty: "EASY" },
        { id: 154, title: "Detect Cycle in Undirected Graph", link: "https://www.geeksforgeeks.org/detect-cycle-undirected-graph/", difficulty: "MEDIUM" },
        { id: 155, title: "Detect Cycle in Directed Graph", link: "https://www.geeksforgeeks.org/detect-cycle-in-a-graph/", difficulty: "MEDIUM" },
        { id: 156, title: "Topological Sort (BFS/DFS)", link: "https://www.geeksforgeeks.org/topological-sorting/", difficulty: "MEDIUM" },
        { id: 157, title: "Number of Islands", link: "https://leetcode.com/problems/number-of-islands/", difficulty: "MEDIUM" },
        { id: 158, title: "Bipartite Graph Check", link: "https://leetcode.com/problems/is-graph-bipartite/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 159, title: "Course Schedule I / II", link: "https://leetcode.com/problems/course-schedule-ii/", difficulty: "MEDIUM" },
        { id: 160, title: "Find Eventual Safe States", link: "https://leetcode.com/problems/find-eventual-safe-states/", difficulty: "MEDIUM" },
        { id: 161, title: "Alien Dictionary (Topological Sort)", link: "https://www.geeksforgeeks.org/given-sorted-dictionary-find-precedence-characters/", difficulty: "HARD" },
        { id: 162, title: "Kahn's Algorithm (BFS-based Topological Sort)", link: "https://www.geeksforgeeks.org/topological-sorting-indegree-based-solution/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "graph-2",
    day: 24,
    topic: "Graph Part-II",
    problems: {
      easy: [],
      medium: [
        { id: 163, title: "Dijkstra's Shortest Path Algorithm", link: "https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/", difficulty: "MEDIUM" },
        { id: 164, title: "Bellman-Ford Algorithm", link: "https://www.geeksforgeeks.org/bellman-ford-algorithm-dp-23/", difficulty: "MEDIUM" },
        { id: 165, title: "Floyd-Warshall Algorithm", link: "https://www.geeksforgeeks.org/floyd-warshall-algorithm-dp-16/", difficulty: "MEDIUM" },
        { id: 166, title: "Prim's Minimum Spanning Tree", link: "https://www.geeksforgeeks.org/prims-minimum-spanning-tree-mst-greedy-algo-5/", difficulty: "MEDIUM" },
        { id: 167, title: "Kruskal's Minimum Spanning Tree (Union Find)", link: "https://www.geeksforgeeks.org/kruskals-minimum-spanning-tree-algorithm-greedy-algo-2/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 168, title: "Cheapest Flights Within K Stops", link: "https://leetcode.com/problems/cheapest-flights-within-k-stops/", difficulty: "MEDIUM" },
      ],
    },
  },
  {
    key: "dp-1",
    day: 25,
    topic: "Dynamic Programming",
    problems: {
      easy: [
        { id: 169, title: "Maximum Product Subarray", link: "https://leetcode.com/problems/maximum-product-subarray/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 170, title: "Longest Increasing Subsequence", link: "https://leetcode.com/problems/longest-increasing-subsequence/", difficulty: "MEDIUM" },
        { id: 171, title: "Longest Common Subsequence", link: "https://leetcode.com/problems/longest-common-subsequence/", difficulty: "MEDIUM" },
        { id: 172, title: "0/1 Knapsack", link: "https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/", difficulty: "MEDIUM" },
        { id: 173, title: "Edit Distance", link: "https://leetcode.com/problems/edit-distance/", difficulty: "MEDIUM" },
        { id: 174, title: "Maximum Sum Increasing Subsequence", link: "https://www.geeksforgeeks.org/maximum-sum-increasing-subsequence-dp-14/", difficulty: "MEDIUM" },
      ],
      hard: [
        { id: 175, title: "Matrix Chain Multiplication", link: "https://www.geeksforgeeks.org/matrix-chain-multiplication-dp-8/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "dp-2",
    day: 26,
    topic: "Dynamic Programming Part-II",
    problems: {
      easy: [],
      medium: [
        { id: 176, title: "Minimum Path Sum", link: "https://leetcode.com/problems/minimum-path-sum/", difficulty: "MEDIUM" },
        { id: 177, title: "Coin Change (Minimum Coins)", link: "https://leetcode.com/problems/coin-change/", difficulty: "MEDIUM" },
        { id: 178, title: "Coin Change II (Ways to Make Change)", link: "https://leetcode.com/problems/coin-change-ii/", difficulty: "MEDIUM" },
        { id: 179, title: "Subset Sum Problem", link: "https://www.geeksforgeeks.org/subset-sum-problem-dp-25/", difficulty: "MEDIUM" },
        { id: 180, title: "Rod Cutting", link: "https://www.geeksforgeeks.org/cutting-a-rod-dp-13/", difficulty: "MEDIUM" },
        { id: 181, title: "Egg Dropping Problem", link: "https://leetcode.com/problems/super-egg-drop/", difficulty: "HARD" },
      ],
      hard: [
        { id: 182, title: "Longest Palindromic Subsequence", link: "https://leetcode.com/problems/longest-palindromic-subsequence/", difficulty: "MEDIUM" },
        { id: 183, title: "Palindrome Partitioning II (Min Cuts)", link: "https://leetcode.com/problems/palindrome-partitioning-ii/", difficulty: "HARD" },
      ],
    },
  },
  {
    key: "trie",
    day: 27,
    topic: "Trie",
    problems: {
      easy: [
        { id: 184, title: "Implement Trie (Prefix Tree)", link: "https://leetcode.com/problems/implement-trie-prefix-tree/", difficulty: "MEDIUM" },
      ],
      medium: [
        { id: 185, title: "Implement Trie-2 (Delete + Count)", link: "https://www.geeksforgeeks.org/trie-insert-and-search/", difficulty: "MEDIUM" },
        { id: 186, title: "Longest Word in Dictionary", link: "https://leetcode.com/problems/longest-word-in-dictionary/", difficulty: "MEDIUM" },
        { id: 187, title: "Maximum XOR of Two Numbers in an Array", link: "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/", difficulty: "MEDIUM" },
        { id: 188, title: "Phone Directory / Contacts Search", link: "https://www.geeksforgeeks.org/implement-a-phone-directory/", difficulty: "HARD" },
        { id: 189, title: "Word Search II (Trie + Backtracking)", link: "https://leetcode.com/problems/word-search-ii/", difficulty: "HARD" },
      ],
      hard: [
        { id: 190, title: "Count Distinct Substrings", link: "https://www.geeksforgeeks.org/count-distinct-substrings-string-using-suffix-trie/", difficulty: "HARD" },
        { id: 191, title: "Power Set (Generate All Subsets)", link: "https://www.geeksforgeeks.org/recursive-program-to-generate-power-set/", difficulty: "MEDIUM" },
      ],
    },
  },
];

export function getAllStriverProblems() {
  const all: StriverProblem[] = [];
  for (const day of striverSheet) {
    for (const list of [day.problems.easy, day.problems.medium, day.problems.hard]) {
      for (const p of list) {
        all.push(p);
      }
    }
  }
  return all;
}

export const striverTotalProblems = 191;
