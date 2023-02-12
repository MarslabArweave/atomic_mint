import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { WalletSelectButton } from './WalletSelectButton/WalletSelectButton';
import { Navbar, Nav } from 'rsuite';
import HomeIcon from '@rsuite/icons/legacy/Home';
import ContactIcon from '@rsuite/icons/legacy/AddressBook';
import TwitterIcon from '@rsuite/icons/legacy/Twitter';
import GithubIcon from '@rsuite/icons/legacy/Github';
import EmailIcon from '@rsuite/icons/Email';

export const Navigation = (props) => {
  return (<>
    <div>
      <Navbar appearance='subtle'>
        <Navbar.Brand href="#">
          <p style={{height: '1.5rem'}}>WeaveMint</p>
        </Navbar.Brand>
        <Nav>
          <Nav.Menu title="Menu">
            <Link to="/" className='menuText'>
              <Nav.Item icon={<HomeIcon />}>Home</Nav.Item>
            </Link>
            <Nav.Menu icon={<ContactIcon />} title="Contact" className='menuText'>
              <a href='https://twitter.com/mARsLab_2022' className='menuText'>
                <Nav.Item icon={<TwitterIcon />}>Twitter</Nav.Item>
              </a>
              <a href='https://github.com/marslab2022' className='menuText'>
                <Nav.Item icon={<GithubIcon />}>Github</Nav.Item>
              </a>
              <a href='mailto: marslab.2022@gmail.com' className='menuText'>
                <Nav.Item icon={<EmailIcon />}>E-mail</Nav.Item>
              </a>
            </Nav.Menu>
          </Nav.Menu>
        </Nav>
        <Nav pullRight>
          <WalletSelectButton setIsConnected={value => props.setIsWalletConnected(value)} />
        </Nav>
      </Navbar>
    </div>
  </>); 
}
