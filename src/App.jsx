import { TodoistApi } from '@doist/todoist-api-typescript';
import { useEffect, useState } from 'react';
import Draggable from 'react-draggable';

import './App.css';
import ProjectBadge from './components/ProjectBadge';


function App() {

  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [apiKeyInput, setApiKeyInput] = useState(apiKey);

  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem('tasks') || '[]'));
  const [projects, setProjects] = useState(JSON.parse(localStorage.getItem('projects') || '[]'));
  const [projectsDict, setProjectsDict] = useState(JSON.parse(localStorage.getItem('projectsDict') || '{}'));
  const [lastUpdated, setLastUpdated] = useState(localStorage.getItem('lastUpdated') || '');

  const [projectFilter, setProjectFilter] = useState(null);

  let positions = JSON.parse(localStorage.getItem('positions') || '{}');

  useEffect(() => {

    const api = new TodoistApi(apiKey);

    async function fetchData() {

      const projectList = await api.getProjects();
      let projects = {};

      for (let project of projectList) {
        projects[project.id] = project;
      }

      let tasks = await api.getTasks({filter: 'all'});
      tasks = tasks.map(task => {
        task.subtasks = tasks.filter(t => t.parentId === task.id);
        return task;
      })

      tasks = tasks.filter(t => !t.parentId);

      setProjects(projectList);
      setProjectsDict(projects);
      setTasks(tasks);
      setLastUpdated(new Date().toLocaleString());

      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('projects', JSON.stringify(projectList));
      localStorage.setItem('projectsDict', JSON.stringify(projects));
      localStorage.setItem('lastUpdated', new Date().toLocaleString());
 
    }

    apiKey && fetchData();

  }, [apiKey])

  return (
    <div className="App">

      {projects.map(project => (
        <ProjectBadge key={project.id} project={project} inactive={(!(projectFilter == project.id))} onClick={() => projectFilter === project.id ? setProjectFilter(null) : setProjectFilter(project.id)} />
      ))}

      {tasks.map(task => (
        <Draggable
          key={task.id}
          defaultPosition={positions[task.id] || {x: 0, y: 0}}
          onStop={(e, data) => {
            console.log(data);
            positions[task.id] = {x: data.x, y: data.y};
            localStorage.setItem('positions', JSON.stringify(positions));
          }}
        >
          <div className={'task-container' + (task.completed ? " completed":"")} key={task.id} style={{
            opacity: projectFilter ? (projectFilter == task.projectId ? 1 : 0.2) : 1,
          }}>

            <div className="task">

              <ProjectBadge project={projectsDict[task.projectId]} /*onClick={() => setProjectFilter(task.projectId)}*/ />

              <b>{task.content}</b>
              {task?.due?.string && <span className='due'>{task.due.string}</span>}
              
            </div>

            {task.subtasks.map(subtask => (
              <div key={subtask.id} className={"sub task" + (subtask.completed ? " completed":"")}>
                <span>{subtask.content}</span>
                {subtask?.due?.string && <span className='due'>{subtask.due.string}</span>}
              </div>
            ))}

          </div>
        </Draggable>
      ))}

      <div>

        {lastUpdated ? <div>Last updated: {lastUpdated}</div> : <b>Please wait while TodoTab loads.</b>}

        {projectFilter && (
          <button onClick={() => setProjectFilter(null)}>Clear filter</button>
        )}

        {!apiKey && (
          <><b>Set your Todoist API key to continue</b><br/></>
        )}
        <input type="text" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} />
        <button onClick={() => {localStorage.setItem('apiKey', apiKeyInput); setApiKey(apiKeyInput)}}>Save</button>
      </div>

    </div>
      )
}

      export default App
