// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as SDK from '../sdk/sdk.js';  // eslint-disable-line no-unused-vars
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UIComponents from '../ui/components/components.js';  // eslint-disable-line rulesdir/es_modules_import
import * as UI from '../ui/ui.js';

export class CSPViolationsListView extends UI.Widget.VBox {
  private table = new UIComponents.DataGridController.DataGridController();
  private categoryFilter = new Set<string>();
  private issueRows =
      new Map<SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue, UIComponents.DataGridUtils.Row>();

  constructor() {
    super(true);
    this.registerRequiredCSS('issues/cspViolationsListView.css', {enableLegacyPatching: false});

    this.table.data = {
      columns: [
        {id: 'sourceCode', title: 'Source Code', sortable: false, widthWeighting: 1, visible: true, hideable: false},
        {
          id: 'violatedDirective',
          title: 'Violated Directive',
          sortable: false,
          widthWeighting: 1,
          visible: true,
          hideable: false,
        },
        {id: 'category', title: 'Category', sortable: false, widthWeighting: 1, visible: true, hideable: false},
        {id: 'status', title: 'Status', sortable: false, widthWeighting: 1, visible: true, hideable: false},
      ],
      rows: [],
    };
    this.contentElement.appendChild(this.table);
  }

  updateTextFilter(filter: string) {
    if (filter.length === 0) {
      this.table.data = {...this.table.data, filters: []};
    } else {
      this.table.data = {
        ...this.table.data,
        filters: [{text: filter, key: undefined, regex: undefined, negative: false}],
      };
    }
  }

  updateCategoryFilter(categories: Set<string>) {
    this.categoryFilter = categories;
    const rows = [];
    for (const [issue, row] of this.issueRows.entries()) {
      if (this.isIssueInFilterCategories(issue)) {
        rows.push(row);
      }
    }
    this.table.data = {...this.table.data, rows: rows};
  }

  private isIssueInFilterCategories(issue: SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue): boolean {
    return (this.categoryFilter.has(issue.code()) || this.categoryFilter.size === 0);
  }

  addIssue(issue: SDK.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue) {
    const sourceCode = issue.details().sourceCodeLocation;
    if (!sourceCode) {
      return;
    }
    const status = issue.details().isReportOnly ? 'report-only' : 'blocked';
    const category = this.issueViolationCodeToCategoryName(issue.code());
    const newIssue = {
      cells: [
        {
          columnId: 'sourceCode',
          value: sourceCode.url,
          renderer: () => LitHtml.html`<devtools-linkifier .data=${{
            url: sourceCode.url,
            lineNumber: sourceCode.lineNumber,
          } as UIComponents.Linkifier.LinkifierData}></devtools-linkifier>`,
        },
        {columnId: 'violatedDirective', value: issue.details().violatedDirective},
        {columnId: 'category', value: category},
        {columnId: 'status', value: status},
      ],
    };
    this.issueRows.set(issue, newIssue);

    if (this.isIssueInFilterCategories(issue)) {
      this.table.data.rows.push(newIssue);
      this.table.data = {...this.table.data};
    }
  }

  clearIssues() {
    this.issueRows.clear();
    this.table.data = {...this.table.data, rows: []};
  }

  private issueViolationCodeToCategoryName(code: string): string {
    if (code === SDK.ContentSecurityPolicyIssue.inlineViolationCode) {
      return 'Inline Violation';
    }
    if (code === SDK.ContentSecurityPolicyIssue.urlViolationCode) {
      return 'URL Violation';
    }
    if (code === SDK.ContentSecurityPolicyIssue.evalViolationCode) {
      return 'Eval Violation';
    }
    if (code === SDK.ContentSecurityPolicyIssue.trustedTypesSinkViolationCode) {
      return 'Sink Violation';
    }
    if (code === SDK.ContentSecurityPolicyIssue.trustedTypesPolicyViolationCode) {
      return 'Policy Violation';
    }
    return 'unknown';
  }
}
