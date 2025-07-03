# k6 Load Tests: Automated fastnDB API Lifecycle

## Overview

This setup runs automated k6 load tests that simulate the full lifecycle of a project in fastnDB, from authentication to workspace deletion, for 100 different projects. The test metrics are exported to InfluxDB v1 and visualized in Grafana.

---

## Test Lifecycle Steps

1. **auth**  
   Obtain an authentication token for API access.
2. **createWorkspace**  
   Create a new workspace/project with a unique name.
3. **updateWorkspaceToEnterprise**  
   Change the workspace type to "enterprise".
4. **createTable**  
   Create a new table in the workspace with a simple schema (one string field: `"title"`).
5. **addRecords**  
   Add records to the created table.
6. **getRecords**  
   Retrieve records from the table to verify insertion.
7. **removeTable**  
   Delete the table from the workspace.
8. **enableWorkspaceDeletion**  
   Enable the workspace deletion feature.
9. **deleteWorkspace**  
   Delete the workspace/project.

---

## Load Test Configuration

- **Virtual Users (VUs):** 50
- **Iterations per VU:** 1
- **Total Projects Simulated:** 100 (adjust VUs/iterations as needed)
- **Max Duration:** 1 hour

---


## Summary

- This test automates the full API lifecycle for fastnDB projects at scale.
- All test metrics are stored in InfluxDB v1 and visualized in Grafana for monitoring and analysis.


## Run the Script
Execute ./run-k6.sh to: