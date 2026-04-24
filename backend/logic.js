/**
 * Logic for processing the SRM Engineering Challenge hierarchy data.
 */

function processHierarchy(data) {
  const user_id = "sharathchandra_28062005";
  const email_id = "sg9686@srmist.edu.in";
  const college_roll_number = "RA2311030010007";

  const invalid_entries = [];
  const duplicate_edges = [];
  const seen_edge_strings = new Set();
  const valid_edges = [];
  const child_to_parent = new Map();
  const all_nodes = new Set();

  if (!Array.isArray(data)) {
      return {
          user_id,
          email_id,
          college_roll_number,
          hierarchies: [],
          invalid_entries: ["Input is not an array"],
          duplicate_edges: [],
          summary: { total_trees: 0, total_cycles: 0, largest_tree_root: "" }
      };
  }

  // 1. Filter and Validate Edges
  data.forEach((entry) => {
    if (typeof entry !== "string") {
      invalid_entries.push(String(entry));
      return;
    }

    const trimmed = entry.trim();
    const match = trimmed.match(/^([A-Z])->([A-Z])$/);

    if (!match) {
      invalid_entries.push(trimmed);
      return;
    }

    const parent = match[1];
    const child = match[2];

    if (parent === child) {
      invalid_entries.push(trimmed); // Self-loop treated as invalid
      return;
    }

    const edge_str = `${parent}->${child}`;

    if (seen_edge_strings.has(edge_str)) {
      if (!duplicate_edges.includes(edge_str)) {
        duplicate_edges.push(edge_str);
      }
      return;
    }

    seen_edge_strings.add(edge_str);

    // Multi-parent case: if child already has a parent, discard silently
    if (child_to_parent.has(child)) {
      // Discarded silently as per rule 4
      return;
    }

    child_to_parent.set(child, parent);
    valid_edges.push({ parent, child });
    all_nodes.add(parent);
    all_nodes.add(child);
  });

  // 2. Build Adjacency List
  const adj = new Map();
  const reverse_adj = new Map(); // child -> parent (actually child_to_parent covers this)
  all_nodes.forEach(node => {
      adj.set(node, []);
  });
  valid_edges.forEach(({ parent, child }) => {
    adj.get(parent).push(child);
  });

  // 3. Find Connected Components (Weakly Connected)
  const visited_component = new Set();
  const components = [];

  // Build an undirected graph for component finding
  const undirected_adj = new Map();
  all_nodes.forEach(node => undirected_adj.set(node, []));
  valid_edges.forEach(({ parent, child }) => {
    undirected_adj.get(parent).push(child);
    undirected_adj.get(child).push(parent);
  });

  all_nodes.forEach(node => {
    if (!visited_component.has(node)) {
      const component = [];
      const queue = [node];
      visited_component.add(node);
      while (queue.length > 0) {
        const curr = queue.shift();
        component.push(curr);
        undirected_adj.get(curr).forEach(neighbor => {
          if (!visited_component.has(neighbor)) {
            visited_component.add(neighbor);
            queue.push(neighbor);
          }
        });
      }
      components.push(component);
    }
  });

  const hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;
  let largest_tree_root = "";
  let max_depth = -1;

  // 4. Process each component
  components.forEach(component => {
    // Find nodes with in-degree 0 in this component
    const in_degree = new Map();
    component.forEach(node => in_degree.set(node, 0));
    component.forEach(node => {
      adj.get(node).forEach(child => {
        in_degree.set(child, (in_degree.get(child) || 0) + 1);
      });
    });

    const roots = component.filter(node => in_degree.get(node) === 0).sort();

    if (roots.length > 0) {
      // It's a set of trees (or one tree)
      // Actually, since each node has at most one parent, 
      // each root defines exactly one tree in this component.
      roots.forEach(root => {
        const { tree, depth, has_cycle } = buildTree(root, adj);
        
        if (has_cycle) {
            total_cycles++;
            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            total_trees++;
            hierarchies.push({
                root,
                tree,
                depth
            });

            if (depth > max_depth) {
                max_depth = depth;
                largest_tree_root = root;
            } else if (depth === max_depth) {
                if (largest_tree_root === "" || root < largest_tree_root) {
                    largest_tree_root = root;
                }
            }
        }
      });
    } else {
      // Pure cycle component
      total_cycles++;
      const root = component.sort()[0];
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    }
  });

  return {
    user_id,
    email_id,
    college_roll_number,
    hierarchies: hierarchies.sort((a, b) => a.root.localeCompare(b.root)),
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root
    }
  };
}

function buildTree(root, adj) {
  const visited = new Set();
  const stack = new Set();
  let has_cycle = false;

  function checkCycle(node) {
    if (stack.has(node)) {
      has_cycle = true;
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    adj.get(node).forEach(child => checkCycle(child));
    stack.delete(node);
  }

  checkCycle(root);

  if (has_cycle) {
    return { tree: {}, depth: 0, has_cycle: true };
  }

  // Build nested object and calculate depth
  function getNested(node) {
    const children = adj.get(node);
    const obj = {};
    let depth = 1;
    let max_child_depth = 0;

    children.forEach(child => {
      const { tree, depth: childDepth } = getNested(child);
      obj[child] = tree[child];
      if (childDepth > max_child_depth) {
          max_child_depth = childDepth;
      }
    });

    return { tree: { [node]: obj }, depth: depth + max_child_depth };
  }

  return getNested(root);
}

module.exports = { processHierarchy };
