async page => {
  const url = page.url();
  return {
    pass: url.includes('AgentView.aspx'),
    url,
  };
};
