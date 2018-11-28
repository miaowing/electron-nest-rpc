## Description

The electron-nest-rpc module provides a simple way to invoke nest service between the renderer process (web page) and the main process.

## Installation

```bash
$ npm i --save electron-nest-rpc
```

## Quick Start

#### Main Process

```typescript
import { ApplicationModule } from "./app.module";
import { BrowserWindow } from 'electron';
import { NestFactory } from "@nestjs/core";
import { NestRPC } from 'electron-nest-rpc';
import * as path from 'path';

async function bootstrap() {
    const window = new BrowserWindow({
        show: true,
        width: 966,
        height: 647,
        minWidth: 966,
        minHeight: 647,
        titleBarStyle: 'hidden',
    });
    const nestContext = await NestFactory.create(ApplicationModule);
    NestRPC.register(nestContext);
    
    window.loadURL(formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true
    }));
}

bootstrap();
```

#### Renderer Process

```typescript jsx
import * as React from 'react';
import { nestRPC, RPCException } from 'electron-nest-rpc';
import { UserService } from './services/UserService';

export class TestPage extends React.Component<any> {
    private readonly userService: UserService = nestRPC(UserService);
    private state = {users: []};
    
    constructor(props: any) {
        super(props);
    }
    
    async componentDidMount() {
        try {
            const users = await this.userService.getUsers();
            this.setState({users});
        } catch (e: RPCException) {
            console.log(e.message);
        }
    }
    
    render() {
        const users = this.state.users;
        return <ul>
            {users.map(user => <li key={user.id}>{user.name}</li>)}
        </ul>;
    }
}
```

## Stay in touch

- Author - [Miaowing](https://github.com/miaowing)

## License

  Nest is [MIT licensed](LICENSE).
